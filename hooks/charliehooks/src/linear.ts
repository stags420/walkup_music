type LinearGraphqlError = {
  message: string;
};

type LinearGraphqlResponse<TData> = {
  data?: TData;
  errors?: LinearGraphqlError[];
};

export type LinearClient = {
  apiKey: string;
  teamKey: string;
  dryRun: boolean;
};

export type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  description: string;
  stateName: string;
};

export type LinearIssueReference = {
  id: string;
  identifier: string;
  stateName: string;
};

export function createLinearClient(options: {
  apiKey: string;
  teamKey: string;
  dryRun?: boolean;
}): LinearClient {
  return {
    apiKey: options.apiKey,
    teamKey: options.teamKey,
    dryRun: options.dryRun ?? false,
  };
}

async function linearGraphql<TData>(
  client: LinearClient,
  query: string,
  variables: Record<string, unknown>,
): Promise<TData> {
  const timeoutMs = 10_000;
  const response: Response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: client.apiKey,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Linear GraphQL HTTP ${response.status}`);
  }

  const payloadUnknown: unknown = await response.json();

  const payload: LinearGraphqlResponse<TData> = payloadUnknown as LinearGraphqlResponse<TData>;
  if (payload.errors && payload.errors.length > 0) {
    const messages: string = payload.errors.map((error) => error.message).join('; ');
    throw new Error(`Linear GraphQL error: ${messages}`);
  }

  if (!payload.data) {
    throw new Error('Linear GraphQL error: missing data');
  }

  return payload.data;
}

export async function getIssueByIdentifier(
  client: LinearClient,
  identifier: string,
): Promise<LinearIssue> {
  const numberMatch: RegExpMatchArray | null = identifier.match(/-(\d+)$/);
  if (!numberMatch) {
    throw new Error(`Invalid Linear issue identifier: ${identifier}`);
  }

  const issueNumber = Number(numberMatch[1]);
  if (!Number.isFinite(issueNumber) || issueNumber <= 0) {
    throw new Error(`Invalid Linear issue identifier: ${identifier}`);
  }

  const query =
    'query($teamKey:String!,$number:Float!){ issues(filter:{ team:{ key:{ eq:$teamKey } }, number:{ eq:$number } }){ nodes { id identifier title description state { name } } } }';

  const data: {
    issues: {
      nodes: {
        id: string;
        identifier: string;
        title: string;
        description: string;
        state: { name: string };
      }[];
    };
  } = await linearGraphql(client, query, { teamKey: client.teamKey, number: issueNumber });

  const issue = data.issues.nodes[0];
  if (!issue) {
    throw new Error(`Linear issue not found: ${identifier}`);
  }

  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description ?? '',
    stateName: issue.state.name,
  };
}

export async function getIssueById(client: LinearClient, id: string): Promise<LinearIssue> {
  const query =
    'query($id:String!){ issue(id:$id){ id identifier title description state { name } } }';

  const data: {
    issue: {
      id: string;
      identifier: string;
      title: string;
      description: string;
      state: { name: string };
    } | null;
  } = await linearGraphql(client, query, { id });

  if (!data.issue) {
    throw new Error(`Linear issue not found: ${id}`);
  }

  return {
    id: data.issue.id,
    identifier: data.issue.identifier,
    title: data.issue.title,
    description: data.issue.description ?? '',
    stateName: data.issue.state.name,
  };
}

export async function getWorkflowStateNameById(client: LinearClient, id: string): Promise<string> {
  const query = 'query($id:String!){ workflowState(id:$id){ id name } }';
  const data: { workflowState: { id: string; name: string } | null } = await linearGraphql(
    client,
    query,
    { id },
  );

  if (!data.workflowState) {
    throw new Error(`Linear workflow state not found: ${id}`);
  }

  return data.workflowState.name;
}

async function getWorkflowStateIdByName(
  client: LinearClient,
  stateName: string,
): Promise<string> {
  const query =
    'query($name:String!){ workflowStates(filter:{name:{eq:$name}}){ nodes { id name team { key } } } }';

  const data: {
    workflowStates: {
      nodes: { id: string; name: string; team: { key: string } }[];
    };
  } = await linearGraphql(client, query, { name: stateName });

  for (const node of data.workflowStates.nodes) {
    if (node.team.key === client.teamKey) {
      return node.id;
    }
  }

  throw new Error(`Linear workflow state not found: ${client.teamKey}:${stateName}`);
}

export async function setIssueState(
  client: LinearClient,
  issueIdentifier: string,
  stateName: string,
): Promise<void> {
  const issue: LinearIssue = await getIssueByIdentifier(client, issueIdentifier);

  if (issue.stateName === stateName) {
    return;
  }

  if (client.dryRun) {
    console.log(
      `[dry-run] Linear issue ${issueIdentifier}: ${issue.stateName} -> ${stateName}`,
    );
    return;
  }

  const stateId: string = await getWorkflowStateIdByName(client, stateName);
  const mutation =
    'mutation($id:String!,$stateId:String!){ issueUpdate(id:$id, input:{ stateId:$stateId }) { success } }';

  const data: { issueUpdate: { success: boolean } } = await linearGraphql(client, mutation, {
    id: issue.id,
    stateId,
  });

  if (!data.issueUpdate.success) {
    throw new Error(`Linear issueUpdate failed: ${issueIdentifier} -> ${stateName}`);
  }
}

export async function setIssueStateById(
  client: LinearClient,
  issueId: string,
  stateName: string,
): Promise<void> {
  const issue: LinearIssue = await getIssueById(client, issueId);

  if (issue.stateName === stateName) {
    return;
  }

  if (client.dryRun) {
    console.log(`[dry-run] Linear issue ${issue.identifier}: ${issue.stateName} -> ${stateName}`);
    return;
  }

  const stateId: string = await getWorkflowStateIdByName(client, stateName);
  const mutation =
    'mutation($id:String!,$stateId:String!){ issueUpdate(id:$id, input:{ stateId:$stateId }) { success } }';

  const data: { issueUpdate: { success: boolean } } = await linearGraphql(client, mutation, {
    id: issue.id,
    stateId,
  });

  if (!data.issueUpdate.success) {
    throw new Error(`Linear issueUpdate failed: ${issue.identifier} -> ${stateName}`);
  }
}

export async function getBlockRelationsByIssueId(
  client: LinearClient,
  issueId: string,
): Promise<{ blockers: LinearIssueReference[]; blocks: LinearIssueReference[] }> {
  const query =
    'query($id:String!){ issue(id:$id){ id relations(first:50){ nodes{ type relatedIssue{ id identifier state{ name } } } } inverseRelations(first:50){ nodes{ type issue{ id identifier state{ name } } } } } }';

  const data: {
    issue: {
      id: string;
      relations: {
        nodes: {
          type: string;
          relatedIssue: {
            id: string;
            identifier: string;
            state: { name: string };
          } | null;
        }[];
      };
      inverseRelations: {
        nodes: {
          type: string;
          issue: {
            id: string;
            identifier: string;
            state: { name: string };
          } | null;
        }[];
      };
    } | null;
  } = await linearGraphql(client, query, { id: issueId });

  if (!data.issue) {
    throw new Error(`Linear issue not found: ${issueId}`);
  }

  const blockersById: Map<string, LinearIssueReference> = new Map();
  for (const relation of data.issue.inverseRelations.nodes) {
    if (relation.type !== 'blocks' || !relation.issue) {
      continue;
    }

    blockersById.set(relation.issue.id, {
      id: relation.issue.id,
      identifier: relation.issue.identifier,
      stateName: relation.issue.state.name,
    });
  }

  const blocksById: Map<string, LinearIssueReference> = new Map();
  for (const relation of data.issue.relations.nodes) {
    if (relation.type !== 'blocks' || !relation.relatedIssue) {
      continue;
    }

    blocksById.set(relation.relatedIssue.id, {
      id: relation.relatedIssue.id,
      identifier: relation.relatedIssue.identifier,
      stateName: relation.relatedIssue.state.name,
    });
  }

  return {
    blockers: [...blockersById.values()],
    blocks: [...blocksById.values()],
  };
}

export async function addIssueComment(
  client: LinearClient,
  issueIdentifier: string,
  body: string,
): Promise<void> {
  const issue: LinearIssue = await getIssueByIdentifier(client, issueIdentifier);

  if (client.dryRun) {
    console.log(`[dry-run] Linear comment on ${issueIdentifier}: ${body}`);
    return;
  }

  const mutation =
    'mutation($issueId:String!,$body:String!){ commentCreate(input:{issueId:$issueId, body:$body}) { success } }';

  const data: { commentCreate: { success: boolean } } = await linearGraphql(client, mutation, {
    issueId: issue.id,
    body,
  });

  if (!data.commentCreate.success) {
    throw new Error(`Linear commentCreate failed: ${issueIdentifier}`);
  }
}

export async function addIssueCommentById(
  client: LinearClient,
  issueId: string,
  body: string,
): Promise<void> {
  if (client.dryRun) {
    console.log(`[dry-run] Linear comment on ${issueId}: ${body}`);
    return;
  }

  const mutation =
    'mutation($issueId:String!,$body:String!){ commentCreate(input:{issueId:$issueId, body:$body}) { success } }';

  const data: { commentCreate: { success: boolean } } = await linearGraphql(client, mutation, {
    issueId,
    body,
  });

  if (!data.commentCreate.success) {
    throw new Error(`Linear commentCreate failed: ${issueId}`);
  }
}
