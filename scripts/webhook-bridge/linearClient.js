const LINEAR_API_URL = 'https://api.linear.app/graphql';

export class LinearClient {
  /** @type {string} */
  #apiKey;

  /** @type {string} */
  #teamKey;

  /** @type {string | null} */
  #teamId = null;

  /** @type {Map<string, string> | null} */
  #workflowStateIdsByName = null;

  /**
   * @param {{ apiKey: string, teamKey: string }} config
   */
  constructor(config) {
    this.#apiKey = config.apiKey;
    this.#teamKey = config.teamKey;
  }

  /**
   * @template T
   * @param {string} query
   * @param {Record<string, unknown>=} variables
   * @returns {Promise<T>}
   */
  async graphql(query, variables) {
    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        Authorization: this.#apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    /** @type {{ data?: T, errors?: { message: string }[] }} */
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        `Linear API HTTP ${response.status}: ${JSON.stringify(payload)}`,
      );
    }

    if (payload.errors && payload.errors.length > 0) {
      throw new Error(`Linear API error: ${payload.errors[0].message}`);
    }

    if (!payload.data) {
      throw new Error('Linear API error: missing data');
    }

    return payload.data;
  }

  /** @returns {Promise<string>} */
  async getTeamId() {
    if (this.#teamId) {
      return this.#teamId;
    }

    const data = await this.graphql(
      `query Teams {
        teams {
          nodes { id key }
        }
      }`,
    );

    // @ts-expect-error: runtime validated
    const team = data.teams.nodes.find((node) => node.key === this.#teamKey);
    if (!team) {
      throw new Error(`Linear team not found for key: ${this.#teamKey}`);
    }

    // @ts-expect-error: runtime validated
    this.#teamId = team.id;
    return this.#teamId;
  }

  /** @returns {Promise<Map<string, string>>} */
  async getWorkflowStateIdsByName() {
    if (this.#workflowStateIdsByName) {
      return this.#workflowStateIdsByName;
    }

    const teamId = await this.getTeamId();
    const data = await this.graphql(
      `query WorkflowStates($first: Int!) {
        workflowStates(first: $first) {
          nodes { id name team { id } }
        }
      }`,
      { first: 200 },
    );

    /** @type {Map<string, string>} */
    const map = new Map();

    // @ts-expect-error: runtime validated
    for (const node of data.workflowStates.nodes) {
      // @ts-expect-error: runtime validated
      if (node.team && node.team.id === teamId) {
        // @ts-expect-error: runtime validated
        map.set(node.name, node.id);
      }
    }

    if (map.size === 0) {
      throw new Error(`No workflow states found for teamId: ${teamId}`);
    }

    this.#workflowStateIdsByName = map;
    return map;
  }

  /**
   * @param {string} identifier
   * @returns {Promise<{ id: string, identifier: string, title: string, description: string | null } | null>}
   */
  async findIssueByIdentifier(identifier) {
    const teamId = await this.getTeamId();
    const data = await this.graphql(
      `query SearchIssues($term: String!, $teamId: String!) {
        searchIssues(term: $term, teamId: $teamId) {
          nodes { id identifier title description }
        }
      }`,
      { term: identifier, teamId },
    );

    // @ts-expect-error: runtime validated
    const exact = data.searchIssues.nodes.find((n) => n.identifier === identifier);
    if (!exact) {
      return null;
    }

    // @ts-expect-error: runtime validated
    return { id: exact.id, identifier: exact.identifier, title: exact.title, description: exact.description };
  }

  /**
   * @param {string} identifier
   * @param {string} stateName
   * @returns {Promise<{ issueId: string, stateId: string }>}
   */
  async moveIssueToState(identifier, stateName) {
    const issue = await this.findIssueByIdentifier(identifier);
    if (!issue) {
      throw new Error(`Linear issue not found for identifier: ${identifier}`);
    }

    const workflowStateIdsByName = await this.getWorkflowStateIdsByName();
    const stateId = workflowStateIdsByName.get(stateName);
    if (!stateId) {
      throw new Error(`Linear workflow state not found: ${stateName}`);
    }

    await this.graphql(
      `mutation UpdateIssueState($id: String!, $stateId: String!) {
        issueUpdate(id: $id, input: { stateId: $stateId }) {
          success
        }
      }`,
      { id: issue.id, stateId },
    );

    return { issueId: issue.id, stateId };
  }

  /**
   * @param {string} issueId
   * @param {string} body
   */
  async createComment(issueId, body) {
    await this.graphql(
      `mutation CommentCreate($issueId: String!, $body: String!) {
        commentCreate(input: { issueId: $issueId, body: $body }) {
          success
        }
      }`,
      { issueId, body },
    );
  }
}
