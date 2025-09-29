HiLCoE
School of Computer Science and Technology
ENTERPRISE FLEET MANAGEMENT PLATFORM
SENIOR PROJECT FINAL DOCUMENT
Prepared by:
LEUL TEWODROS AGONAFER
LEUL YARED ASEFA
KIDUS MESFIN MEKURIA
September 2025
AN ENTERPRISE CLOUD FLEET MANAGEMENT PLATFORM WITH
ADAPTIVE ROUTING, DYNAMIC PASSENGER POOLING & PREDICTIVE
FORECASTING
Prepared by:
LEUL TEWODROS AGONAFER
LEUL YARED ASEFA
KIDUS MESFIN MEKURIA
A SENIOR PROJECT DOCUMENT SUBMITTED TO THE
UNDERGRADUATE PROGRAMME OFFICE IN PARTIAL FULFILLMENT
OF THE REQUIREMENTS FOR THE DEGREE OF BACHELOR OF SCIENCE
IN COMPUTER SCIENCE
Advisor:
ZELALEM
SEPTEMBER 2025
HiLCoE
School of Computer Science and Technology
Enterprise Fleet Management Platform
Prepared by:
LEUL TEWODROS AGONAFER
LEUL YARED ASEFA
KIDUS MESFIN MEKURIA
Approved By:
Advisor: Signature:
Examiner: Signature:

# Acknowledgement
We would like to express our deepest gratitude and sincere appreciation to our project supervisor,
Abdella E. Mohammed, and our advisor, Zelalem, for their invaluable guidance, unwavering
support, and insightful feedback throughout the duration of this senior project. Their expertise
and encouragement were instrumental in navigating the complexities of this undertaking and
shaping the final outcome.
We are also thankful to the faculty and staff of HiLCOE School of Computer Science and T ech-
nology for providing us with the foundational knowledge and the academic environment neces-
sary to pursue this project.
Finally, we wish to acknowledge the collaborative spirit and dedication of our team members.
This project is a testament to our collective effort, perseverance, and shared vision. We are also
grateful for the support of our families and friends who stood by us during this challenging and
rewarding journey .
i

# Executive Summary
The motivation for this project came from a very practical situation: the way companies manage
shuttle services for employees is often slow, costly, and unreliable. In Addis Ababa and similar
urban areas, daily transport is usually coordinated with simple tools such as Excel files, scattered
emails, and a lot of phone calls. These methods work only to a point—ineﬀicient routes cause
delays, waste fuel, and over time, the hidden costs can exceed 20% .
T o resolve this, our team followed an agile, step-by-step process . We engaged stakeholders,
reviewed daily workflows, and shaped a layered architecture that kept the interface, services,
APIs, and data clearly separated. The system stack combines a Node.js/Express/T ypeScript
backend with Prisma/PostgreSQL , aReact/Vite frontend , and route optimization that lever-
ages heuristic pre-ordering with Mapbox Directions and local fallback routines .
Routing was approached in two phases: clustering pickup points geographically, then gen-
erating shuttle paths. This staged approach, supported by Mapbox with fallback strategies,
proved more reliable than monolithic optimization and was validated through iterative testing.
Routegna ended up as a modular platform that handles the core operations of shuttle man-
agement , including route generation, vehicle assignment, driver updates, payroll reporting, and
dashboards with analytics. In practice, the system is expected to reduce planning time by up to

## 15% and operational costs by roughly 20% , while improving route coherence. The platform
isn’t one-size-fits-all either—drivers, managers, finance staff, and administrators each see tools
and views that match their role.
Challenges were encountered, particularly with unreliable APIs. This was addressed by imple-
menting stricter API contracts, proxying for external services, and a local heuristic fallback
to ensure robust routing even when third‑party services are unstable.
Overall, Routegna replaces fragmented, manual coordination with a single data-driven system .
The benefits are faster planning, reduced waste, and scalable operations . Most importantly,
it offers organizations a dependable framework to manage transportation more effectively,
moving away from fragile, ad-hoc methods that have long undermined eﬀiciency . Future work
may integrate demand forecasting and predictive scheduling .
ii

# Contents

# Acknowledgement i

# Executive Summary ii
1 Introduction 1

## 1.1 Background . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 1

## 1.2 Statement of the Problem . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 2

## 1.3 Objectives . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3

## 1.3.1 General Objective . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3

## 1.3.2 Specific Objectives . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3

## 1.4 Scope and Limitation . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4

## 1.4.1 Scope . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4

## 1.4.2 Limitations . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5

## 1.5 Methodology / Approach . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5

## 1.5.1 Requirements Analysis & System Design . . . . . . . . . . . . . . . . 6

## 1.5.2 Implementation . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 6

## 1.5.3 T esting Strategy . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 6

## 1.5.4 Deployment . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7

## 1.5.5 System Diagrams . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7

## 1.6 Significance and Beneficiaries . . . . . . . . . . . . . . . . . . . . . . . . . . 9

## 1.6.1 Significance . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9

## 1.6.2 Beneficiaries . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9

## 1.6.3 Key Performance Indicators (KPIs) . . . . . . . . . . . . . . . . . . . 10

## 1.6.4 Adoption Considerations & Risks . . . . . . . . . . . . . . . . . . . . 11

## 1.6.5 Next Steps (Recommendations) . . . . . . . . . . . . . . . . . . . . . 11
2 System and Software Requirements Specification (SRS) 12

## 2.1 Introduction/Overview . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12

## 2.2 Current System (Existing Manual W orkflow) . . . . . . . . . . . . . . . . . . 12

## 2.3 Proposed System . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12

## 2.3.1 Function Definition and System Modules . . . . . . . . . . . . . . . . 12

## 2.3.2 Functional Requirements . . . . . . . . . . . . . . . . . . . . . . . . . 12

## 2.3.3 Non-functional Requirements . . . . . . . . . . . . . . . . . . . . . . 12

## 2.4 System Models . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12

## 2.4.1 Use Case Diagrams . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12

## 2.4.2 Component and Architecture Diagram . . . . . . . . . . . . . . . . . . 12

## 2.5 User Interface (UI) Mockups . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
iii
3 Design Specification Document 13

## 3.1 System Design Document (SDD) . . . . . . . . . . . . . . . . . . . . . . . . . 13

## 3.1.1 Architectural Style (Layered & Microservice) . . . . . . . . . . . . . . 13

## 3.1.2 Subsystem Decomposition (Frontend, Backend, Optimization Service) . 13

## 3.1.3 Data Persistence and Schema Design . . . . . . . . . . . . . . . . . . 13

## 3.1.4 Deployment and Runtime View . . . . . . . . . . . . . . . . . . . . . 13

## 3.1.5 Key Decisions and Trade-offs . . . . . . . . . . . . . . . . . . . . . . 13

## 3.2 Object Design Document (ODD) . . . . . . . . . . . . . . . . . . . . . . . . . 13

## 3.2.1 Package and Module Decomposition . . . . . . . . . . . . . . . . . . . 13

## 3.2.2 Key Class and Interface Descriptions . . . . . . . . . . . . . . . . . . 13

## 3.2.3 Error Handling and Exception Strategy . . . . . . . . . . . . . . . . . 13

## 3.2.4 UML Diagrams (Sequence, Class Diagrams) . . . . . . . . . . . . . . 13
4 Implementation Report 14

## 4.1 Development Environment and T echnology Stack . . . . . . . . . . . . . . . . 14

## 4.2 Implementation of Key Modules and Algorithms . . . . . . . . . . . . . . . . 14

## 4.2.1 Core Backend Service Implementation (Node.js/Express) . . . . . . . . 14

## 4.2.2 Optimization Service Implementation (Python/FastAPI) . . . . . . . . 14

## 4.2.3 Frontend Application Implementation (React) . . . . . . . . . . . . . . 14

## 4.3 Code for Major Functionalities (Annotated Snippets) . . . . . . . . . . . . . . 14

## 4.4 T esting Specification and Reports . . . . . . . . . . . . . . . . . . . . . . . . . 14

## 4.4.1 Unit T esting . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14

## 4.4.2 Integration T esting . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14

## 4.4.3 End-to-End (E2E) T esting . . . . . . . . . . . . . . . . . . . . . . . . 14

## 4.4.4 T est Results Summary . . . . . . . . . . . . . . . . . . . . . . . . . . 14

# References 15
A User Manual 17
B Data Collection Methods and T ools 18
Milestones 19
iv

## List of Figures

## 1.1 A high-level diagram showing the frontend client, API server, and data store,
with an optional external optimizer. . . . . . . . . . . . . . . . . . . . . . . . 7

## 1.2 A flowchart tracing the system end to end, from user input through optimization
to analytics output. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 8
v

## List of Tables

## 1.1 Key Performance Indicators for Platform Adoption . . . . . . . . . . . . . . . 10
vi

# Chapter 1 – Introduction
This report describes the design, development, and evaluation of an enterprise cloud-based fleet
management platform that supports adaptive routing, passenger pooling, and predictive fore-
casting. The system, called Routegna, was developed as part of the Senior Project course at
HiLCoE School of Computer Science and T echnology in 2025. The project was completed by
Leul T ewodros Agonafer, Leul Y ared Asefa, and Kidus Mesfin Mekuria, under the guidance of
Advisor Zelalem.
At its heart, Routegna is a Software-as-a-Service (SaaS) solution tailored for corporate shut-
tle operations. Unlike fragmented approaches—where organizations juggle spreadsheets, GPS
trackers, or manual call-based coordination—the platform pulls together scheduling, routing,
payroll, and driver communication in a single place. This integration is meant to reduce ineﬀi-
ciencies and administrative overhead, both of which are common pain points when companies
rely on improvised tools.
The rest of this introduction is organized as follows: first, the background of the problem is
outlined. Then, the problem statement and objectives are presented, followed by a discussion
of scope, methodology, and significance.

## 1.1. Background
In large and congested cities such as Addis Ababa, Ethiopia, managing employee shuttles is
no small task. Many companies still depend on basic coordination tools—Excel sheets, phone
calls, and scattered email threads. While these methods may work when only a few vehicles and
employees are involved, they quickly fall short as scale and complexity grow . Routes remain
ineﬀicient, fuel gets wasted, delays increase, and administrative teams become overwhelmed.
Research backs up these observations. W ork on the Employee Shuttle Bus Routing Problem
has shown that algorithmic optimization can cut total travel distances by around 30–35%, with
corresponding savings in both cost and time [ 1]. In some cases, optimized scheduling has been
linked to fuel consumption reductions of nearly 50% [ 2]. Numbers like these illustrate just how
wide the gap is between manual coordination and systematic, algorithm-driven routing.
The problem has become even harder in recent years. Flexible working arrangements, dis-
tributed workforces, and the need to serve employees across different time zones mean that
demand fluctuates day by day . Unexpected disruptions—traﬀic jams, late departures, sudden
route changes—only add to the challenge. These situations fall into what is formally known as
the Dynamic V ehicle Routing Problem (DVRP), which requires adaptive and, often, real-time
solutions [ 3].
1
Routegna was developed in response to these challenges. The idea was to provide a modern,
multi-tenant fleet management platform that adapts routes dynamically, reduces costs, and im-
proves the reliability of corporate transport services, with a design that can later be containerized
or deployed to cloud environments.

## 1.2. Statement of the Problem
Before this system was built, corporate shuttles in places like Addis Ababa were coordinated
through manual, fragmented workflows. A typical day looked like this: coordinators gathered
ride requests from scattered emails or chats, pasted everything into a spreadsheet, and sketched
routes by eyeballing Google Maps. Final plans went out as paper printouts or quick texts. When
a vehicle broke down or traﬀic stalled, the “fix” was a string of phone calls. Month-end was
worse: HR and finance sifted through paper logs to reconcile hours and invoices. It worked—
barely—but it didn’t scale, and it invited errors.
These practices produced a set of interlocking problems that Routegna set out to address:
Ineﬀicient Route Planning and Cost Inflation
Manually drawn routes are rarely optimal. V ehicles take longer paths, burn more fuel, and push
drivers into overtime. Formally, the task maps to the V ehicle Routing Problem (VRP) whose
common objective is to minimize total cost
C=∑
(dijcijxij) +∑
(fkyk),
where dijis distance, cijcost per unit distance, xijwhether an edge is used, fka fixed vehicle
cost, and ykindicates vehicle use. Manual planning makes no systematic attempt to minimize
this objective, so avoidable costs persist [ 4].
Scheduling Complexity and Capacity Mismatch
Coordinating pickups across asynchronous shifts (sometimes spanning time zones) is error-
prone. The result is predictable: some shuttles overcrowded, others nearly empty; delays for
riders and wasted capacity for operators [ 1].
Demand Uncertainty Without Forecasting
Daily demand fluctuates, but spreadsheets don’t forecast. A basic accuracy measure is Mean
Absolute Error (MAE):
MAE =1
nn∑
i=1|yi−ˆyi|,
where yiis actual demand and ˆyithe prediction. Without even lightweight forecasting, organi-
zations chronically under- or over-allocate vehicles [ 5].
2
Heavy Administrative Overhead
Finance/HR teams spend hours reconciling logs, vendor hours, and invoices by hand. Case
studies of optimized routing and scheduling report material reductions in planning and process-
ing time alongside fuel and mileage savings—evidence that automation yields real operational
gains [ 6].
Security and Enterprise Readiness Gaps
Sensitive data (home locations, schedules) handled via shared spreadsheets and messaging apps
lacks role-based access control and strong tenancy boundaries. Enterprise deployments require
multi-tenant isolation and policy-driven controls that generic tools simply don’t provide [ 7].
Poor Stakeholder Experience
Drivers receive static instructions and little live context; riders get late or inconsistent pickup
information; managers see only fragments of the picture. Confidence erodes across the board.
In short, the status quo was ineﬀicient, error-prone, and hard to scale. Routegna targets these
pain points directly with an automated, secure, and adaptive platform that replaces manual
guesswork with data-driven operations.

## 1.3. Objectives

## 1.3.1 General Objective
The principal aim of this work is to design, implement, and validate a web-based, enterprise-
grade SaaS platform that automates and optimizes corporate shuttle operations. This covers the
full lifecycle from demand intake through dynamic routing and scheduling to payroll reconcil-
iation and operational analytics—delivered in a secure, organization-scoped form suitable for
enterprise environments [ 1], [ 7].

## 1.3.2 Specific Objectives
•Implement a T wo-Stage Route Optimization Process. The platform first uses a Python/FastAPI
microservice to group pickup points into geographically sensible clusters. Subsequently, a
client-side nearest-neighbor heuristic computes the optimal stop ordering within each cluster,
supported by Mapbox Directions for travel metrics. This staged approach is more tractable
than monolithic optimization and is designed to cut travel time and operational costs [ 1], [ 8].
•Implement Demand Analytics & Reporting Dashboards and APIs expose peak demand
windows, route utilization, eﬀiciency indicators, and payroll-ready exports. Forecasting is
identified as future work but not yet implemented.
•Design a Secure Architecture for Enterprise Deployment The system is built on Express
+ Prisma with organization-scoped data access, role checks, and environment-driven config-
uration to ensure data sovereignty and secure enterprise use [ 7].
3
•Create a Responsive, Role-A ware Web Interface The platform delivers modern, responsive
dashboards with role-gated views for administrators, shuttle managers, finance teams, and
drivers. The UI emphasizes clarity, low cognitive load, and task-centered workflows so that
each role only sees what matters to them.
•Develop an Automated Payroll Module The system provides payroll reports and vendor-
ready invoice exports via integrated backend endpoints, using trip and assignment data. This
reduces reconciliation time, minimizes invoicing errors, and produces auditable computed
records for finance teams [ 2].
•Establish a Secure, Maintainable Backend Foundation The backend uses Node.js + T ype-
Script with Prisma ORM for type-safe DB access. Authentication and authorization are im-
plemented using Better Auth, with session-based OAuth2 and role checks. Schema validation
on inputs, route-level permission enforcement, and a modular architecture support maintain-
ability and easier integration with client systems [ 9].

## 1.4. Scope and Limitation
The project had to be scoped carefully . On the one hand, we wanted to show a full end-to-end
shuttle management solution; on the other, we needed something we could realistically finish
within the academic schedule. What follows is what actually made it in, and what was left for
later.

## 1.4.1 Scope
•System architecture.
The platform is designed as a multi-tenant system where data security and isolation are en-
forced at the application level. Each client organization’s data is strictly partitioned using
organization-scoped queries via Prisma and role-based access control, preventing data leakage
between tenants [ 7], [ 9]. This modular architecture provides a foundation for future scaling.
•Interfaces. A web dashboard (React.js) serves as the main entry point. It adapts to different
screens and provides separate views for admins, managers, finance staff, and drivers [ 2]. The
idea was to keep things simple but role-specific, instead of overloading a single interface with
everything.
•Core services. Basic CRUD operations cover employees, drivers, vehicles, stops, and sched-
ules. Scheduling automation and payroll generation are also in scope. For persistence, we
used PostgreSQL with Prisma ORM, while access control is enforced through session-based
OAuth2 via Better Auth, with role checks and organization scoping [ 9].
•Optimization. Route optimization is a two-stage process. The workflow begins with a call to
a Python/FastAPI microservice that clusters stops based on location. The client then performs
4
a nearest-neighbor heuristic on the returned clusters to determine the final stop order. This
process reflects a two-stage approach common in vehicle routing literature [ 1], [ 5], [ 8].
•Analytics. A reporting module turns trip history into insights: peak times, route utilization,
and payroll summaries. The design leaves space for “green VRP” extensions, like emissions-
aware optimization, in the future [ 10].
•Geospatial support. Mapbox APIs provide route visualizations and stop mapping. The back-
end can also forward configured requests to external optimization endpoints when needed,
extending flexibility for routing logic [ 8].
•Documentation and testing. Architectural decisions, error handling, and security consider-
ations were logged along the way . T esting was defined at several levels — unit, integration,
and flow-based — to cover the most critical scenarios.

## 1.4.2 Limitations
Some features did not make it into the first version, either because they are resource-intensive
or not essential to proving the concept:
•GPS tracking. No dedicated hardware integration; only browser-based location sharing, and
even that is session-bound.
•Analytics dependency. Analytics improve gradually with operational data; new deployments
require time before reports become useful.
•Payroll scope. The system produces auditable invoices and exports but does not process
payments, connect to banks, or handle tax rules.
•Driver portal. Drivers can view their assigned routes and stops, but they cannot change them.
•Mobile. The system is available as a responsive web interface; a native mobile application is
out of scope.
•Deferred advanced work. Advanced features like real-time rerouting, predictive mainte-
nance, telemetry pipelines, a native mobile app, complex billing, and active-active replication
were consciously postponed. The current system assumes one primary region per client, with
a simple failover plan rather than global redundancy .

## 1.5. Methodology / Approach
The way Routegna was developed was not a straight, rigid process. It combined formal en-
gineering practices with a fair amount of iteration and adjustment along the way . We leaned
on domain-driven design (DDD) ideas within a layered architecture. Clear separation between
UI, API, and data layers—along with organization-scoped APIs—kept responsibilities separate,
ensured tenant isolation, and made it easier to evolve parts of the system without breaking the
5
whole thing [ 9].

## 1.5.1 Requirements Analysis & System Design
The first step was to understand what the system needed to do. This involved discussions with
potential users to define expected behavior. Several outputs came from this stage:
•User roles. Four categories are supported: administrators (setup and oversight), managers
(route planning), finance staff (payroll), and drivers (route viewing). Permissions are deliber-
ately strict to reduce complexity for each role.
•User story mapping. W orkflows were written as small stories. A typical one: a manager
creates a route → the optimizer computes stop ordering and path → the driver sees the final
assignment on their dashboard [ 3]. These stories later became the skeleton for manual testing.
•Wireframes. Low and high-fidelity mockups were produced for desktop dashboards and
responsive mobile layouts.
•Database schema. PostgreSQL was selected, with a schema designed to enforce tenant data
separation at the database level.
•API outlines. REST endpoints were designed with predictable patterns to facilitate future
integrations.

## 1.5.2 Implementation
Implementation followed a layered approach with a single backend and a React client:
•Frontend (React): Builds the dashboard, integrates Mapbox GL for mapping, and provides
role-aware views.
•Backend (Node.js/Express + Prisma): Handles business logic, Better Auth authentication
with Organizations, organization-scoped APIs, scheduling, and payroll/reporting endpoints.
•Optimization module (Client + Mapbox Directions): Computes stop ordering using a
nearest-neighbor heuristic and requests route geometry, distance, and duration from Mapbox
Directions, with a local fallback when external APIs are unavailable. The backend exposes
an optional proxy path for future external optimizers.
•Analytics & reporting: Generated from operational data via backend endpoints and surfaced
in the UI.

## 1.5.3 Testing Strategy
T esting wasn’t left for the end; it was layered throughout development.
•Unit/integration tests: Vitest + supertest validate API endpoints and server-side business
logic.
6
•Client tests: Lightweight component tests are supported, while end-to-end UI flows are ver-
ified manually using mock data in the development environment.
•Authorization checks: A matrix of role and tenant permissions is exercised through tests to
ensure no unauthorized cross-access occurs.
This multi-level approach helps catch issues before they become systemic.

## 1.5.4 Deployment
Deployment uses environment-based configuration and standard Node.js tooling.
•Build: ‘pnpm‘ scripts build the client (Vite) and server (T ypeScript) packages.
•Runtime: The server starts as a standard Node.js process, and the client is served as static
assets.
•Configuration: Environment variables control the database connection, authentication provider,
and external API keys (e.g., Mapbox).
•Observability: The system relies on structured console logs for debugging and monitoring.

## 1.5.5 System Diagrams
T wo diagrams support the written methodology: a high-level diagram showing the client, API
layer, and data store (Figure 1.1 ), and a flowchart illustrating the end-to-end process (Figure

## 1.2 ).
Figure 1.1: A high‐level diagram showing the frontend client, API server, and data store, with
an optional external optimizer.
7
Figure 1.2: A flowchart tracing the system end to end, from user input through optimization
to analytics output.
8

## 1.6. Significance and Beneficiaries

## 1.6.1 Significance
The Routegna platform was built not only to solve immediate operational headaches but also
to provide a foundation for longer-term transformation. Its relevance can be seen across four
dimensions: operational, financial, technological, and environmental.
•Operational eﬀiciency. In most organizations, route planning and payroll reconciliation con-
sume many staff hours every week. Studies on similar automation report that such tasks can
be reduced by over 80% [ 6], freeing time for supervisors to focus on service quality instead
of repetitive paperwork.
•Financial savings. Research on shuttle optimization repeatedly shows reductions in operating
costs (about 23% daily), fuel usage (roughly one-third annually), and maintenance spend (over

## 35%). In some cases, fleet sizes can be trimmed by 21–27% without reducing coverage [ 1],
[2]. Even if actual results vary by context, the trend is clear: automated routing translates into
tangible savings.
•Digital transformation.
Replacing spreadsheets, phone calls, and printed manifests with a secure SaaS system sup-
ports Ethiopia’s Digital Transformation Strategy 2025 [ 11]. By adopting an organization-
scoped, layered architecture and a modern stack, organizations take a practical step toward
becoming data-driven and innovation-ready .
•Environmental and social impact. Optimized routing leads to fewer kilometers driven, less
fuel burned, and lower CO 2emissions [ 12]. The same architecture can eventually integrate
electric vehicles and charging-station data, helping companies align with national green mo-
bility goals. On the social side, dependable shuttle services expand workforce participation
by enabling staff from a wider geographic spread to commute reliably .

## 1.6.2 Beneficiaries
The platform benefits multiple groups, each in different ways:
•Company executives. Lower costs and more eﬀicient asset use directly improve the bottom
line, while dashboards surface KPIs for strategic decision-making.
•Shuttle planners and administrators. Routine route-building becomes automated. Dash-
boards highlight utilization, cost-per-trip, and on-time performance, giving staff an instant
overview .
•HR and finance teams. Payroll exports are generated automatically from trip logs, cutting
about six staff hours per week [ 6]. This also improves audit readiness and budgeting accuracy .
9
•Drivers. Clear stop lists and live navigation prompts reduce confusion. With fewer last-
minute changes, drivers report less stress compared to paper-based coordination.
•Employees (riders). Commutes become more predictable, with travel times shortened by up
to 15% [ 8]. Overcrowding is also reduced through better demand–capacity balancing.
•IT and operations staff. The system uses a modern, maintainable stack (React, Node.js,
Prisma) built on a layered architecture. Application-level multi-tenancy and environment-
based configurations simplify management and ensure data isolation without the overhead of
a complex microservice infrastructure.
•Environmental and social stakeholders. Reduced mileage contributes to cleaner air [ 12].
Dependable mobility options also widen access to employment opportunities, particularly in
areas with limited transport.

## 1.6.3 Key Performance Indicators (KPIs)
Adoption should be measured with specific, repeatable metrics:
Table 1.1: Key Performance Indicators for Platform Adoption
KPI Why It Matters Owner CadenceTarget (12
months)
Onboarding
timeIndicates ease of
setup for new
organizationsProduct Ops Per org50% faster vs.
baseline
Scheduling
exception rateReflects automation
qualityOps Lead W eekly–30% in 6
months
V ehicle
utilization
(%)Links directly to cost
eﬀiciencyFleet
ManagerMonthly +10–15% Y oY
Payroll
accuracy &
reconciliation
timeBuilds finance trust HR/Finance MonthlyReduce errors &
save 6+ hrs/wk
Authorization
deny rate
(unexpected)Signals
permission/security
healthSecurity DailyKeep denials
minimal and
explainable
API error rate
(5xx)Core reliability
metricBackend/SRE Daily<1% across
endpoints
Mean time to
detect
(MTTD)Observability
benchmarkSRE/Security Per incident <30 minutes
These KPIs are not just technical; they tie adoption to tangible organizational outcomes. In
10
practice, they help ensure that the system remains both trustworthy and sustainable as usage
scales.

## 1.6.4 Adoption Considerations & Risks
Rolling out Routegna successfully requires attention beyond the technology itself. Key consid-
erations include:
•Roles and permissions. Misconfigured roles can frustrate users or create hidden security
risks. Start with conservative role templates and refine them as teams gain experience.
•Data migration. Transferring historical trip records from spreadsheets or legacy systems
must be carefully validated to prevent cross-tenant errors or data corruption.
•Operational readiness. Support teams should have runbooks and conduct simulation exer-
cises before the platform goes live.
•Partner integrations. External APIs need to be tested in sandbox environments, with clear
rate limits and service agreements.
•Observability gaps. Begin with logs and a small set of key metrics; gradually expand to full
tracing and service-level objectives as the system matures.

## 1.6.5 Next Steps (Recommendations)
T o maximize impact and ensure smooth adoption, the following steps are recommended:
•Establish baseline KPIs. Measure initial performance during pilot rollouts to identify gaps
and track improvements.
•Publish role templates. Provide default least-privilege templates to reduce configuration
errors and accelerate onboarding.
•Create a data migration checklist. Ensure tenant imports are safe, validated, and auditable.
•Release a partner integration guide. Include sample payloads, expected responses, and
error-handling instructions.
•Conduct incident tabletop exercises. Simulate potential issues to test alerts, escalation pro-
cedures, and response coordination.
11

# Chapter 2 – System and Software Requirements Specification (SRS)

## 2.1. Introduction/Overview

## 2.2. Current System (Existing Manual Workflow)

## 2.3. Proposed System

## 2.3.1 Function Definition and System Modules

## 2.3.2 Functional Requirements

## 2.3.3 Non‐functional Requirements

## 2.4. System Models

## 2.4.1 Use Case Diagrams

## 2.4.2 Component and Architecture Diagram

## 2.5. User Interface (UI) Mockups
12

# Chapter 3 – Design Specification Document

## 3.1. System Design Document (SDD)

## 3.1.1 Architectural Style (Layered & Microservice)

## 3.1.2 Subsystem Decomposition (Frontend, Backend, Optimization Service)

## 3.1.3 Data Persistence and Schema Design

## 3.1.4 Deployment and Runtime View

## 3.1.5 Key Decisions and Trade‐offs

## 3.2. Object Design Document (ODD)

## 3.2.1 Package and Module Decomposition

## 3.2.2 Key Class and Interface Descriptions

## 3.2.3 Error Handling and Exception Strategy

## 3.2.4 UML Diagrams (Sequence, Class Diagrams)
13

# Chapter 4 – Implementation Report

## 4.1. Development Environment and Technology Stack

## 4.2. Implementation of Key Modules and Algorithms

## 4.2.1 Core Backend Service Implementation (Node.js/Express)

## 4.2.2 Optimization Service Implementation (Python/FastAPI)

## 4.2.3 Frontend Application Implementation (React)

## 4.3. Code for Major Functionalities (Annotated Snippets)

## 4.4. Testing Specification and Reports

## 4.4.1 Unit Testing

## 4.4.2 Integration Testing

## 4.4.3 End‐to‐End (E2E) Testing

## 4.4.4 Test Results Summary
14

# References
[1] F. Altıparmak and I. Kara, “Employee shuttle bus routing problem,” in Proc. 5th Int.
Conf. Ind. Eng. Oper. Manage. , Dubai, UAE, Mar. 2020. [Online]. A vailable: https :
//www.researchgate.net/publication/341726808_Employee_Shuttle_Bus_
Routing_Problem .
[2] M. M. A ydın, E. Sokolovskij, P . Jaskowski, and J. Matijošius, “Service management of
employee shuttle service under inhomogeneous fleet constraints using dynamic linear
programming: A case study,” Appl. Sci. , vol. 14, no. 9, p. 3604, 2024. [Online]. A vailable:
https://www.mdpi.com/2076-3417/15/9/4604 .
[3] V . Pillac, M. Gendreau, C. Guéret, and A. Medaglia, “ A review of dynamic vehicle rout-
ing problems,” European Journal of Operational Research , vol. 225, no. 1, pp. 1–11,

## 2013. [Online]. A vailable: https://hal.science/hal-00739779v1/document .
[4] Wikipedia, V ehicle routing problem , Jul. 2023. [Online]. A vailable: https : / / en .
wikipedia.org/wiki/Vehicle_routing_problem .
[5] Q. W ang and J. Holguín- V eras, “ A tour-based urban freight demand model using entropy
maximization,” in Presented at the 91st Annual Meeting of the T ransportation Research
Board , W ashington D.C., 2012. [Online]. A vailable: https://onlinepubs.trb.org/
onlinepubs/shrp2/c20/015atour-based.pdf .
[6] Aptean, Aptean Routing & Scheduling Case Study: George’s , Apr. 2021. [Online]. A vail-
able: https://www.aptean.com/en- US/insights/success- story/paragons-
software-helps-georges-deliver-fleet-and-fuel-savings .
[7] P . K. Akkah, E. K. K. Sakyi, and J. K. Panford, “Multi-tenancy in cloud native architec-
ture: A systematic mapping study,” in Proc. 2021 IEEE 14th Int. Conf. on Cloud Com-
puting (CLOUD) , 2021, pp. 248–252. [Online]. A vailable: https://pure.port.ac.
uk / ws / portalfiles / portal / 70449994 / Multi _ tenancy _ in _ cloud _ native _
architecture_PDF.pdf .
[8] G. Peker and D. Türsel Eliiyi, “Employee shuttle bus routing problem: A case study,”
Avrupa Bilim ve T eknoloji Dergisi , no. 46, pp. 151–160, 2023. [Online]. A vailable: https:
//dergipark.org.tr/en/download/article-file/2641311 .
15
[9] F. Jamshidi, C. Pahl, N. Cito, and N. Medvidovic, “Microservices: The journey so far and
challenges ahead,” IEEE Software , vol. 35, no. 3, pp. 24–35, May 2018. DOI: 10.1109/
MS . 2018 . 2141039 . [Online]. A vailable: https : / / doi . org / 10 . 1109 / MS . 2018 .

## 2141039 .
[10] C. Lin, K. L. Choy, G. T . S. Ho, S. H. Chung, and H. Y . Lam, “Survey of green vehicle
routing problem: Past and future trends,” Expert Systems with Applications , vol. 41, no. 4,
pp. 1118–1138, 2014. DOI: 10 . 1016 / j . eswa . 2013 . 07 . 107 . [Online]. A vailable:
https://doi.org/10.1016/j.eswa.2013.07.107 .
[11] Ministry of Innovation and T echnology, Ethiopia, “Digital ethiopia 2025: A strategy for
ethiopia’s digital transformation,” Ministry of Innovation and T echnology, Addis Ababa,
Ethiopia, T ech. Rep., 2020. [Online]. A vailable: https : / / www . lawethiopia . com /
images/Policy_documents/Digital-Ethiopia-2025-Strategy-english.pdf .
[12] S. Erdoğan and E. Miller-Hooks, “ A green vehicle routing problem,” T ransportation Re-
search P art E: Logistics and T ransportation Review , vol. 48, no. 1, pp. 100–114, 2012.
DOI: 10.1016/j.tre.2011.08.001 . [Online]. A vailable: https://hal.science/
hal-03182944v1/document .
16

# Appendix A – User Manual
17

# Appendix B – Data Collection Methods and Tools
18
Milestones
19
