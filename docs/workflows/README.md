# Workflows

Every non-trivial change follows the same loop:

**inspect → define acceptance criteria → implement → verify → review → resolve findings → record**

| Workflow                                                 | Use it for                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| [feature-implementation.md](feature-implementation.md)   | New pages, sections, interactions, or components                 |
| [bug-fix.md](bug-fix.md)                                 | Investigating and repairing a defect                             |
| [content-publishing.md](content-publishing.md)           | Articles, projects, certificates, skills, experience, the resume |
| [ui-accessibility-review.md](ui-accessibility-review.md) | Manual responsive, keyboard, reduced-motion, and fallback review |
| [seo-performance-review.md](seo-performance-review.md)   | Metadata, structured data, crawlability, Lighthouse              |
| [review-and-handoff.md](review-and-handoff.md)           | Reviewing a change and reporting it                              |
| [release.md](release.md)                                 | Preparing and verifying a production deployment                  |

Roles: [planner](../roles/planner.md), [implementer](../roles/implementer.md),
[reviewer](../roles/reviewer.md). Records: [agent-runs](../agent-runs/README.md).
One agent can perform all roles; it labels its review as self-review.
