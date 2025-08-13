---
inclusion: always
---
# UI Design Guidelines

These guidelines are opinionated and optimized for React + React-Bootstrap.

## Design System

- **Tokens**: Define and reuse spacing, radius, color, and typography tokens. Prefer `rem` over `px`.
  - Spacing: `--space-1: .25rem`, `--space-2: .5rem`, `--space-3: 1rem`, `--space-4: 1.5rem`.
  - Radius: `--radius-1: .25rem`, `--radius-2: .5rem`.
  - Typography: Base `16px`, scale `1.25` for headings.
- **Semantics**: Use semantic color roles (primary, success, warning, danger, info, surface, text-muted). Do not hardcode brand hexes inline.
- **Icons**: Prefer a single icon set; keep sizes consistent.

## React-Bootstrap First

- Prefer React-Bootstrap components over raw HTML. Reach for utilities and component props before custom CSS.
- Layout using `Container`, `Row`, `Col` with responsive props (`xs`, `sm`, `md`, `lg`, `xl`).
- Use `Stack` for vertical spacing and `Button`, `Form`, `Card`, `Alert`, `Spinner`, `Modal` for standardized UI.

Example:

```tsx
<Container fluid="md">
  <Row className="gy-3">
    <Col md={6}>
      <Card><Card.Body>Left</Card.Body></Card>
    </Col>
    <Col md={6}>
      <Card><Card.Body>Right</Card.Body></Card>
    </Col>
  </Row>
  <Stack direction="horizontal" gap={2} className="mt-3">
    <Button variant="primary">Save</Button>
    <Button variant="outline-secondary">Cancel</Button>
  </Stack>
  
  {/* States */}
  <Alert variant="info" className="mt-3">No players yet</Alert>
  <Spinner animation="border" role="status" />
  <Modal show={show} onHide={onClose} />
  <Form><Form.Control placeholder="Search" /></Form>
  
  {/* Media */}
  <img className="img-fluid rounded" alt="..." />
</Container>
```

## Theming

- Light/Dark uses Bootstrap theming (`data-bs-theme`) via a single effect in the app shell. Do not set theme in individual components.
- Keep contrast AA or better; test with devtools.
- Theme selection persists via Zustand `persist`; access via hooks like `useSettingsTheme()`.

## Accessibility (A11y)

- All interactive elements keyboard accessible (Tab/Shift+Tab), visible focus ring, and ARIA where appropriate.
- Labels for all inputs; use `Form.Label` linked via `htmlFor`.
- Provide ARIA `role`, `aria-live` for async updates, and `aria-expanded`/`aria-controls` for collapsibles.
- Never convey information by color alone. Provide text or icon affordances.

## Responsiveness

- Avoid fixed pixel widths/heights. Use `%`, `rem`, `vh/vw`, and Bootstrap responsive utilities.
- Use responsive props (`<Col md={6}>`) instead of multiple CSS media queries when possible.
- Images and media should be `img-fluid` and contained within responsive parents.

## Copy and Content

- Keep button labels concise: prefer “Save” over “Save Player Changes”.
- Use sentence case for labels and headings.
- Provide empty, loading, and error states for all async views.

## CSS and Customization

- Prefer Bootstrap variables and utility classes before writing custom CSS.
- If custom CSS is needed, scope by component and avoid global selectors. Use BEM or CSS Modules.
- Do not inline large style blocks in JSX; keep styles adjacent to components.

## Patterns to Prefer

- **Lists**: Use `ListGroup` and `Table` for structured data; add sorting/pagination only when needed (YAGNI).
- **Forms**: Use `Form` controls with validation feedback. Disable submit during async; show progress via `Spinner` or `Button` `isLoading` pattern.
- **Feedback**: Use `Toast`/`Alert` for transient messages; keep them dismissible.

## Quick Checklist

- Uses React-Bootstrap components; minimal custom CSS; prefer reusing existing components or extracting subcomponents with meaningful names
- Keyboard accessible; focus ring visible and not suppressed
- Text contrast AA+; no color-only signals
- Responsive grid; no hardcoded widths/heights
- Clear empty/loading/error states
- Concise copy and consistent spacing using tokens