# Enterprise Fleet Management Platform — Routegna

LEUL TEWODROS AGONAFER LEUL YARED ASEFA KIDUS MESFIN MEKURIA September 2025 AN ENTERPRISE CLOUD FLEET MANAGEMENT PLATFORM WITH ADAPTIVE ROUTING, DYNAMIC PASSENGER POOLING & PREDICTIVE FORECASTING Prepared by:

LEUL TEWODROS AGONAFER LEUL YARED ASEFA KIDUS MESFIN MEKURIA A SENIOR PROJECT DOCUMENT SUBMITTED TO THE UNDERGRADUATE PROGRAMME OFFICE IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE DEGREE OF BACHELOR OF SCIENCE IN COMPUTER SCIENCE Advisor:

ZELALEM SEPTEMBER 2025 HiLCoE School of Computer Science and Technology Enterprise Fleet Management Platform Prepared by:

LEUL TEWODROS AGONAFER LEUL YARED ASEFA KIDUS MESFIN MEKURIA Approved By:

Advisor: Signature:

Examiner: Signature:

## Acknowledgement

We would like to express our deepest gratitude and sincere appreciation to our project supervisor, Abdella E. Mohammed, and our advisor, Zelalem, for their invaluable guidance, unwavering support, and insightful feedback throughout the duration of this senior project. Their expertise and encouragement were instrumental in navigating the complexities of this undertaking and shaping the final outcome.

We are also thankful to the faculty and staff of HiLCOE School of Computer Science and T echnology for providing us with the foundational knowledge and the academic environment necessary to pursue this project.

Finally, we wish to acknowledge the collaborative spirit and dedication of our team members.

This project is a testament to our collective effort, perseverance, and shared vision. We are also grateful for the support of our families and friends who stood by us during this challenging and rewarding journey .

i Executive Summary The motivation for this project came from a very practical situation: the way companies manage shuttle services for employees is often slow, costly, and unreliable. In Addis Ababa and similar urban areas, daily transport is usually coordinated with simple tools such as Excel files, scattered emails, and a lot of phone calls. These methods work only to a point—ineﬀicient routes cause delays, waste fuel, and over time, the hidden costs can exceed 20% .

T o resolve this, our team followed an agile, step-by-step process . We engaged stakeholders, reviewed daily workflows, and shaped a layered architecture that kept the interface, services, APIs, and data clearly separated. The system stack combines a Node.js/Express/T ypeScript backend with Prisma/PostgreSQL , aReact/Vite frontend , and route optimization that leverages heuristic pre-ordering with Mapbox Directions and local fallback routines .

Routing was approached in two phases: clustering pickup points geographically, then generating shuttle paths. This staged approach, supported by Mapbox with fallback strategies, proved more reliable than monolithic optimization and was validated through iterative testing.

Routegna ended up as a modular platform that handles the core operations of shuttle management , including route generation, vehicle assignment, driver updates, payroll reporting, and dashboards with analytics. In practice, the system is expected to reduce planning time by up to 15% and operational costs by roughly 20% , while improving route coherence. The platform isn’t one-size-fits-all either—drivers, managers, finance staff, and administrators each see tools and views that match their role.

Challenges were encountered, particularly with unreliable APIs. This was addressed by implementing stricter API contracts, proxying for external services, and a local heuristic fallback to ensure robust routing even when third‑party services are unstable.

Overall, Routegna replaces fragmented, manual coordination with a single data-driven system .

The benefits are faster planning, reduced waste, and scalable operations . Most importantly, it offers organizations a dependable framework to manage transportation more effectively, moving away from fragile, ad-hoc methods that have long undermined eﬀiciency . Future work may integrate demand forecasting and predictive scheduling .

ii Contents Acknowledgement i Executive Summary ii 1 Introduction 1

## 1.1 Background . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 1

## 1.2 Statement of the Problem . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 2

## 1.3 Objectives . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3

### 1.3.1 General Objective . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3

### 1.3.2 Specific Objectives . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3

## 1.4 Scope and Limitation . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4

### 1.4.1 Scope . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4

### 1.4.2 Limitations . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5

## 1.5 Methodology / Approach . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5

### 1.5.1 Requirements Analysis & System Design . . . . . . . . . . . . . . . . 6

### 1.5.2 Implementation . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 6

### 1.5.3 T esting Strategy . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 6

### 1.5.4 Deployment . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7

### 1.5.5 System Diagrams . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7

## 1.6 Significance and Beneficiaries . . . . . . . . . . . . . . . . . . . . . . . . . . 9

### 1.6.1 Significance . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9

### 1.6.2 Beneficiaries . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9

### 1.6.3 Key Performance Indicators (KPIs) . . . . . . . . . . . . . . . . . . . 10

### 1.6.4 Adoption Considerations & Risks . . . . . . . . . . . . . . . . . . . . 11

### 1.6.5 Next Steps (Recommendations) . . . . . . . . . . . . . . . . . . . . . 11

2 System and Software Requirements Specification (SRS) 12

## 2.1 Introduction / Overview . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12

## 2.2 Current System (Existing Manual W orkflow) . . . . . . . . . . . . . . . . . . 12

## 2.3 Proposed System . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 13

### 2.3.1 System Context and Actors . . . . . . . . . . . . . . . . . . . . . . . . 14

### 2.3.2 System Modules . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14

### 2.3.3 Functional Requirements . . . . . . . . . . . . . . . . . . . . . . . . . 16

### 2.3.4 Non-Functional Requirements . . . . . . . . . . . . . . . . . . . . . . 16

### 2.3.5 Assumptions and Dependencies . . . . . . . . . . . . . . . . . . . . . 17

### 2.3.6 Constraints . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 17

### 2.3.7 Acceptance Criteria / Success Metrics . . . . . . . . . . . . . . . . . . 17

## 2.4 System Models . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 17

iii

### 2.4.1 Use Case Diagrams . . . . . . . . . . . . . . . . . . . . . . . . . . . . 18

### 2.4.2 Component and Architecture Diagram . . . . . . . . . . . . . . . . . . 43

## 2.5 External Interface Requirements . . . . . . . . . . . . . . . . . . . . . . . . . 44

## 2.6 Requirements Traceability Matrix . . . . . . . . . . . . . . . . . . . . . . . . 45

## 2.7 User Interface (UI) Mockups . . . . . . . . . . . . . . . . . . . . . . . . . . . 46

3 Design Specification Document 51

## 3.1 System Design Document (SDD) . . . . . . . . . . . . . . . . . . . . . . . . . 51

### 3.1.1 Architectural Style (Layered & Microservice) . . . . . . . . . . . . . . 51

### 3.1.2 Subsystem Decomposition . . . . . . . . . . . . . . . . . . . . . . . . 56

### 3.1.3 Data Persistence and Schema Design . . . . . . . . . . . . . . . . . . 60

### 3.1.4 Deployment and Runtime View . . . . . . . . . . . . . . . . . . . . . 66

### 3.1.5 Key Decisions and Trade-offs . . . . . . . . . . . . . . . . . . . . . . 69

## 3.2 Object Design Document (ODD) . . . . . . . . . . . . . . . . . . . . . . . . . 71

### 3.2.1 Package and Module Decomposition . . . . . . . . . . . . . . . . . . . 71

### 3.2.2 Key Class and Interface Descriptions . . . . . . . . . . . . . . . . . . 71

### 3.2.3 Error Handling and Exception Strategy . . . . . . . . . . . . . . . . . 73

### 3.2.4 UML Diagrams . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 74

4 Implementation Report 88

## 4.1 Development Environment and T echnology Stack . . . . . . . . . . . . . . . . 88

## 4.2 Implementation of Key Modules and Algorithms . . . . . . . . . . . . . . . . 88

### 4.2.1 Core Backend Service Implementation (Node.js/Express) . . . . . . . . 88

### 4.2.2 Optimization Service Implementation (Python/FastAPI) . . . . . . . . 88

### 4.2.3 Frontend Application Implementation (React) . . . . . . . . . . . . . . 88

## 4.3 Code for Major Functionalities (Annotated Snippets) . . . . . . . . . . . . . . 88

## 4.4 T esting Specification and Reports . . . . . . . . . . . . . . . . . . . . . . . . . 88

### 4.4.1 Unit T esting . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 88

### 4.4.2 Integration T esting . . . . . . . . . . . . . . . . . . . . . . . . . . . . 88

### 4.4.3 End-to-End (E2E) T esting . . . . . . . . . . . . . . . . . . . . . . . . 88

### 4.4.4 T est Results Summary . . . . . . . . . . . . . . . . . . . . . . . . . . 88

References 89 A User Manual 91 B Data Collection Methods and T ools 92 Milestones 93 iv List of Figures

## 1.1 A high-level diagram showing the frontend client, API server, and data store,

with an optional external optimizer. . . . . . . . . . . . . . . . . . . . . . . . 7

## 1.2 A flowchart tracing the system end to end, from user input through optimization

to analytics output. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 8

## 2.1 Existing Manual W orkflow . . . . . . . . . . . . . . . . . . . . . . . . . . . . 13

## 2.2 Routegna Use Case Model . . . . . . . . . . . . . . . . . . . . . . . . . . . . 18

## 2.3 Use Case Diagram for UC-001 . . . . . . . . . . . . . . . . . . . . . . . . . . 23

## 2.4 Use Case Diagram for UC-002 . . . . . . . . . . . . . . . . . . . . . . . . . . 25

## 2.5 Use Case Diagram for UC-003 . . . . . . . . . . . . . . . . . . . . . . . . . . 26

## 2.6 Use Case Diagram for UC-004 . . . . . . . . . . . . . . . . . . . . . . . . . . 28

## 2.7 Use Case Diagram for UC-005 . . . . . . . . . . . . . . . . . . . . . . . . . . 30

## 2.8 Use Case Diagram for UC-006 . . . . . . . . . . . . . . . . . . . . . . . . . . 32

## 2.9 Use Case Diagram for UC-007 . . . . . . . . . . . . . . . . . . . . . . . . . . 33

## 2.10 Use Case Diagram for UC-008 . . . . . . . . . . . . . . . . . . . . . . . . . . 34

## 2.11 Use Case Diagram for UC-009 . . . . . . . . . . . . . . . . . . . . . . . . . . 35

## 2.12 Use Case Diagram for UC-010 . . . . . . . . . . . . . . . . . . . . . . . . . . 36

## 2.13 Use Case Diagram for UC-011 . . . . . . . . . . . . . . . . . . . . . . . . . . 37

## 2.14 Use Case Diagram for UC-012 . . . . . . . . . . . . . . . . . . . . . . . . . . 38

## 2.15 Use Case Diagram for UC-013 . . . . . . . . . . . . . . . . . . . . . . . . . . 39

## 2.16 Use Case Diagram for UC-014 . . . . . . . . . . . . . . . . . . . . . . . . . . 40

## 2.17 Use Case Diagram for UC-015 . . . . . . . . . . . . . . . . . . . . . . . . . . 41

## 2.18 Use Case Diagram for UC-016 . . . . . . . . . . . . . . . . . . . . . . . . . . 42

## 2.19 High-Level Component and Architecture Diagram . . . . . . . . . . . . . . . . 43

## 2.20 UI Mockup: Login Page . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 46

## 2.21 UI Mockup: Administrator Dashboard . . . . . . . . . . . . . . . . . . . . . . 47

## 2.22 UI Mockup: Route Planning View . . . . . . . . . . . . . . . . . . . . . . . . 48

## 2.23 UI Mockup: Driver Portal . . . . . . . . . . . . . . . . . . . . . . . . . . . . 49

## 2.24 UI Mockup: Payroll Report Page . . . . . . . . . . . . . . . . . . . . . . . . . 50

## 3.1 High-Level Architectural View, illustrating the interaction between the client,

API, data layers, and external optimization services. . . . . . . . . . . . . . . . 53

## 3.2 Detailed Component Interaction Diagram, showing the flow of control and data

between controllers, middleware, services, and the persistence layer. . . . . . . 54

## 3.3 Multi-Fleet W orkflow Activity Diagram, detailing the end-to-end process from

a manager initiating route creation to final plan persistence. . . . . . . . . . . . 55

## 3.4 Subsystem Component View showing data ownership and key interactions. . . 59

## 3.5 Core Operational ERD - 1 . . . . . . . . . . . . . . . . . . . . . . . . . . . . 61

v

## 3.6 Optimization ERD - 2 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 62

## 3.7 Observability & Analytics ERD - 3 . . . . . . . . . . . . . . . . . . . . . . . . 63

## 3.8 Component Diagram: Application Services & Infrastructure Dependencies . . 75

## 3.9 Class Diagram: Domain Entities & Relationships . . . . . . . . . . . . . . . . 76

## 3.10 Layer Diagram: Service & Infrastructure Layers . . . . . . . . . . . . . . . . . 77

## 3.11 Package Diagram: Backend . . . . . . . . . . . . . . . . . . . . . . . . . . . . 78

## 3.12 Component Diagram: Frontend Component Hierarchy . . . . . . . . . . . . . 79

## 3.13 Data Flow Diagram: Frontend Architecture . . . . . . . . . . . . . . . . . . . 80

## 3.14 Sequence Diagram: Create Route with Clustering . . . . . . . . . . . . . . . . 81

## 3.15 Sequence Diagram: Notification Delivery . . . . . . . . . . . . . . . . . . . . 82

## 3.16 Sequence Diagram: V ehicle-to-Route Assignment . . . . . . . . . . . . . . . . 83

## 3.17 Sequence Diagram: Editing an Existing Route . . . . . . . . . . . . . . . . . . 84

## 3.18 Sequence Diagram: Employee Assignment to Routes . . . . . . . . . . . . . . 85

## 3.19 Sequence Diagram: Adding a New V ehicle . . . . . . . . . . . . . . . . . . . 86

## 3.20 Sequence Diagram: Payroll and Analytics Process . . . . . . . . . . . . . . . . 87

vi List of Tables

## 1.1 Key Performance Indicators for Platform Adoption . . . . . . . . . . . . . . . 10

## 2.1 System Actors and Roles . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14

## 2.2 System Modules and Responsibilities . . . . . . . . . . . . . . . . . . . . . . 15

## 2.3 Functional Requirements . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 16

## 2.4 Acceptance Criteria and Success Metrics . . . . . . . . . . . . . . . . . . . . . 17

## 2.5 External Interface Requirements . . . . . . . . . . . . . . . . . . . . . . . . . 44

## 2.6 Requirements Traceability Matrix . . . . . . . . . . . . . . . . . . . . . . . . 45

## 3.1 Subsystem Decomposition and Responsibilities . . . . . . . . . . . . . . . . . 56

## 3.2 Environment T opologies . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 66

## 3.3 Runtime Components and Scaling Characteristics . . . . . . . . . . . . . . . . 67

## 3.4 Resilience and Recovery Patterns . . . . . . . . . . . . . . . . . . . . . . . . . 68

## 3.5 Key Design Decisions and Trade-offs . . . . . . . . . . . . . . . . . . . . . . . 69

## 3.6 Deferred T opics and Revisit Triggers . . . . . . . . . . . . . . . . . . . . . . . 70

## 3.7 Package and Module Decomposition . . . . . . . . . . . . . . . . . . . . . . . 71

## 3.8 Key Backend Class and Module Interfaces . . . . . . . . . . . . . . . . . . . . 72

## 3.9 Key Frontend Component Contracts . . . . . . . . . . . . . . . . . . . . . . . 73

## 3.10 Domain Entity Snapshot . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 73

## 3.11 Error Handling and HTTP Status Codes . . . . . . . . . . . . . . . . . . . . . 73

vii

# Chapter 1 — Introduction

This report describes the design, development, and evaluation of an enterprise cloud-based fleet management platform that supports adaptive routing, passenger pooling, and predictive forecasting. The system, called Routegna, was developed as part of the Senior Project course at HiLCoE School of Computer Science and T echnology in 2025. The project was completed by Leul T ewodros Agonafer, Leul Y ared Asefa, and Kidus Mesfin Mekuria, under the guidance of Advisor Zelalem.

At its heart, Routegna is a Software-as-a-Service (SaaS) solution tailored for corporate shuttle operations. Unlike fragmented approaches—where organizations juggle spreadsheets, GPS trackers, or manual call-based coordination—the platform pulls together scheduling, routing, payroll, and driver communication in a single place. This integration is meant to reduce ineﬀiciencies and administrative overhead, both of which are common pain points when companies rely on improvised tools.

The rest of this introduction is organized as follows: first, the background of the problem is outlined. Then, the problem statement and objectives are presented, followed by a discussion of scope, methodology, and significance.

1.1. Background

In large and congested cities such as Addis Ababa, Ethiopia, managing employee shuttles is no small task. Many companies still depend on basic coordination tools—Excel sheets, phone calls, and scattered email threads. While these methods may work when only a few vehicles and employees are involved, they quickly fall short as scale and complexity grow . Routes remain ineﬀicient, fuel gets wasted, delays increase, and administrative teams become overwhelmed.

Research backs up these observations. W ork on the Employee Shuttle Bus Routing Problem has shown that algorithmic optimization can cut total travel distances by around 30–35%, with corresponding savings in both cost and time [ 1]. In some cases, optimized scheduling has been linked to fuel consumption reductions of nearly 50% [ 2]. Numbers like these illustrate just how wide the gap is between manual coordination and systematic, algorithm-driven routing.

The problem has become even harder in recent years. Flexible working arrangements, distributed workforces, and the need to serve employees across different time zones mean that demand fluctuates day by day . Unexpected disruptions—traﬀic jams, late departures, sudden route changes—only add to the challenge. These situations fall into what is formally known as the Dynamic V ehicle Routing Problem (DVRP), which requires adaptive and, often, real-time solutions [ 3].

1 Routegna was developed in response to these challenges. The idea was to provide a modern, multi-tenant fleet management platform that adapts routes dynamically, reduces costs, and improves the reliability of corporate transport services, with a design that can later be containerized or deployed to cloud environments.

1.2. Statement of the Problem

Before this system was built, corporate shuttles in places like Addis Ababa were coordinated through manual, fragmented workflows. A typical day looked like this: coordinators gathered ride requests from scattered emails or chats, pasted everything into a spreadsheet, and sketched routes by eyeballing Google Maps. Final plans went out as paper printouts or quick texts. When a vehicle broke down or traﬀic stalled, the “fix” was a string of phone calls. Month-end was worse: HR and finance sifted through paper logs to reconcile hours and invoices. It worked— barely—but it didn’t scale, and it invited errors.

These practices produced a set of interlocking problems that Routegna set out to address:

Ineﬀicient Route Planning and Cost Inflation Manually drawn routes are rarely optimal. V ehicles take longer paths, burn more fuel, and push drivers into overtime. Formally, the task maps to the V ehicle Routing Problem (VRP) whose common objective is to minimize total cost C=∑ (dijcijxij) +∑ (fkyk), where dijis distance, cijcost per unit distance, xijwhether an edge is used, fka fixed vehicle cost, and ykindicates vehicle use. Manual planning makes no systematic attempt to minimize this objective, so avoidable costs persist [ 4].

Scheduling Complexity and Capacity Mismatch Coordinating pickups across asynchronous shifts (sometimes spanning time zones) is errorprone. The result is predictable: some shuttles overcrowded, others nearly empty; delays for riders and wasted capacity for operators [ 1].

Demand Uncertainty Without Forecasting Daily demand fluctuates, but spreadsheets don’t forecast. A basic accuracy measure is Mean Absolute Error (MAE):

MAE =1 nn∑ i=1|yi−ˆyi|, where yiis actual demand and ˆyithe prediction. Without even lightweight forecasting, organizations chronically under- or over-allocate vehicles [ 5].

2 Heavy Administrative Overhead Finance/HR teams spend hours reconciling logs, vendor hours, and invoices by hand. Case studies of optimized routing and scheduling report material reductions in planning and processing time alongside fuel and mileage savings—evidence that automation yields real operational gains [ 6].

Security and Enterprise Readiness Gaps Sensitive data (home locations, schedules) handled via shared spreadsheets and messaging apps lacks role-based access control and strong tenancy boundaries. Enterprise deployments require multi-tenant isolation and policy-driven controls that generic tools simply don’t provide [ 7].

Poor Stakeholder Experience Drivers receive static instructions and little live context; riders get late or inconsistent pickup information; managers see only fragments of the picture. Confidence erodes across the board.

In short, the status quo was ineﬀicient, error-prone, and hard to scale. Routegna targets these pain points directly with an automated, secure, and adaptive platform that replaces manual guesswork with data-driven operations.

1.3. Objectives

### 1.3.1 General Objective

The principal aim of this work is to design, implement, and validate a web-based, enterprisegrade SaaS platform that automates and optimizes corporate shuttle operations. This covers the full lifecycle from demand intake through dynamic routing and scheduling to payroll reconciliation and operational analytics—delivered in a secure, organization-scoped form suitable for enterprise environments [ 1], [ 7].

### 1.3.2 Specific Objectives

- Implement a T wo-Stage Route Optimization Process. The platform first uses a Python/- FastAPI microservice to group pickup points into geographically sensible clusters. Subsequently, a client-side nearest-neighbor heuristic computes the optimal stop ordering within each cluster, supported by Mapbox Directions for travel metrics. This staged approach is more tractable than monolithic optimization and is designed to cut travel time and operational costs [1], [ 8].

- Implement Demand Analytics & Reporting Dashboards and APIs expose peak demand windows, route utilization, eﬀiciency indicators, and payroll-ready exports. Forecasting is identified as future work but not yet implemented.

- Design a Secure Architecture for Enterprise Deployment The system is built on Express + Prisma with organization-scoped data access, role checks, and environment-driven config3 uration to ensure data sovereignty and secure enterprise use [ 7].

- Create a Responsive, Role-A ware Web Interface The platform delivers modern, responsive dashboards with role-gated views for administrators, shuttle managers, finance teams, and drivers. The UI emphasizes clarity, low cognitive load, and task-centered workflows so that each role only sees what matters to them.

- Develop an Automated Payroll Module The system provides payroll reports and vendorready invoice exports via integrated backend endpoints, using trip and assignment data. This reduces reconciliation time, minimizes invoicing errors, and produces auditable computed records for finance teams [ 2].

- Establish a Secure, Maintainable Backend Foundation The backend uses Node.js + T ypeScript with Prisma ORM for type-safe DB access. Authentication and authorization are implemented using Better Auth, with session-based OAuth2 and role checks. Schema validation on inputs, route-level permission enforcement, and a modular architecture support maintainability and easier integration with client systems [ 9].

1.4. Scope and Limitation

The project had to be scoped carefully . On the one hand, we wanted to show a full end-to-end shuttle management solution; on the other, we needed something we could realistically finish within the academic schedule. What follows is what actually made it in, and what was left for later.

### 1.4.1 Scope

- System architecture.

The platform is designed as a multi-tenant system where data security and isolation are enforced at the application level. Each client organization’s data is strictly partitioned using organization-scoped queries via Prisma and role-based access control, preventing data leakage between tenants [ 7], [ 9]. This modular architecture provides a foundation for future scaling.

- Interfaces. A web dashboard (React.js) serves as the main entry point. It adapts to different screens and provides separate views for admins, managers, finance staff, and drivers [ 2]. The idea was to keep things simple but role-specific, instead of overloading a single interface with everything.

- Core services. Basic CRUD operations cover employees, drivers, vehicles, stops, and schedules. Scheduling automation and payroll generation are also in scope. For persistence, we used PostgreSQL with Prisma ORM, while access control is enforced through session-based OAuth2 via Better Auth, with role checks and organization scoping [ 9].

- Optimization. Route optimization is a two-stage process. The workflow begins with a call to 4 a Python/FastAPI microservice that clusters stops based on location. The client then performs a nearest-neighbor heuristic on the returned clusters to determine the final stop order. This process reflects a two-stage approach common in vehicle routing literature [ 1], [ 5], [ 8].

- Analytics. A reporting module turns trip history into insights: peak times, route utilization, and payroll summaries. The design leaves space for “green VRP” extensions, like emissionsaware optimization, in the future [ 10].

- Geospatial support. Mapbox APIs provide route visualizations and stop mapping. The backend can also forward configured requests to external optimization endpoints when needed, extending flexibility for routing logic [ 8].

- Documentation and testing. Architectural decisions, error handling, and security considerations were logged along the way . T esting was defined at several levels — unit, integration, and flow-based — to cover the most critical scenarios.

### 1.4.2 Limitations

Some features did not make it into the first version, either because they are resource-intensive or not essential to proving the concept:

- GPS tracking. No dedicated hardware integration; only browser-based location sharing, and even that is session-bound.

- Analytics dependency. Analytics improve gradually with operational data; new deployments require time before reports become useful.

- Payroll scope. The system produces auditable invoices and exports but does not process payments, connect to banks, or handle tax rules.

- Driver portal. Drivers can view their assigned routes and stops, but they cannot change them.

- Mobile. The system is available as a responsive web interface; a native mobile application is out of scope.

- Deferred advanced work. Advanced features like real-time rerouting, predictive maintenance, telemetry pipelines, a native mobile app, complex billing, and active-active replication were consciously postponed. The current system assumes one primary region per client, with a simple failover plan rather than global redundancy .

1.5. Methodology / Approach

The way Routegna was developed was not a straight, rigid process. It combined formal engineering practices with a fair amount of iteration and adjustment along the way . We leaned on domain-driven design (DDD) ideas within a layered architecture. Clear separation between UI, API, and data layers—along with organization-scoped APIs—kept responsibilities separate, 5 ensured tenant isolation, and made it easier to evolve parts of the system without breaking the whole thing [ 9].

### 1.5.1 Requirements Analysis & System Design

The first step was to understand what the system needed to do. This involved discussions with potential users to define expected behavior. Several outputs came from this stage:

- User roles. Four categories are supported: administrators (setup and oversight), managers (route planning), finance staff (payroll), and drivers (route viewing). Permissions are deliberately strict to reduce complexity for each role.

- User story mapping. W orkflows were written as small stories. A typical one: a manager creates a route → the optimizer computes stop ordering and path → the driver sees the final assignment on their dashboard [ 3]. These stories later became the skeleton for manual testing.

- Wireframes. Low and high-fidelity mockups were produced for desktop dashboards and responsive mobile layouts.

- Database schema. PostgreSQL was selected, with a schema designed to enforce tenant data separation at the database level.

- API outlines. REST endpoints were designed with predictable patterns to facilitate future integrations.

### 1.5.2 Implementation

Implementation followed a layered approach with a single backend and a React client:

- Frontend (React): Builds the dashboard, integrates Mapbox GL for mapping, and provides role-aware views.

- Backend (Node.js/Express + Prisma): Handles business logic, Better Auth authentication with Organizations, organization-scoped APIs, scheduling, and payroll/reporting endpoints.

- Optimization module (Client + Mapbox Directions): Computes stop ordering using a nearest-neighbor heuristic and requests route geometry, distance, and duration from Mapbox Directions, with a local fallback when external APIs are unavailable. The backend exposes an optional proxy path for future external optimizers.

- Analytics & reporting: Generated from operational data via backend endpoints and surfaced in the UI.

### 1.5.3 Testing Strategy

T esting wasn’t left for the end; it was layered throughout development.

- Unit/integration tests: Vitest + supertest validate API endpoints and server-side business 6 logic.

- Client tests: Lightweight component tests are supported, while end-to-end UI flows are verified manually using mock data in the development environment.

- Authorization checks: A matrix of role and tenant permissions is exercised through tests to ensure no unauthorized cross-access occurs.

This multi-level approach helps catch issues before they become systemic.

### 1.5.4 Deployment

Deployment uses environment-based configuration and standard Node.js tooling.

- Build: ‘pnpm‘ scripts build the client (Vite) and server (T ypeScript) packages.

- Runtime: The server starts as a standard Node.js process, and the client is served as static assets.

- Configuration: Environment variables control the database connection, authentication provider, and external API keys (e.g., Mapbox).

- Observability: The system relies on structured console logs for debugging and monitoring.

### 1.5.5 System Diagrams

T wo diagrams support the written methodology: a high-level diagram showing the client, API layer, and data store (Figure 1.1 ), and a flowchart illustrating the end-to-end process (Figure

## 1.2 ).

**Figure 1:** .1: A high‐level diagram showing the frontend client, API server, and data store, with

an optional external optimizer.

7

**Figure 1:** .2: A flowchart tracing the system end to end, from user input through optimization

to analytics output.

8 1.6. Significance and Beneficiaries

### 1.6.1 Significance

The Routegna platform was built not only to solve immediate operational headaches but also to provide a foundation for longer-term transformation. Its relevance can be seen across four dimensions: operational, financial, technological, and environmental.

- Operational eﬀiciency. In most organizations, route planning and payroll reconciliation consume many staff hours every week. Studies on similar automation report that such tasks can be reduced by over 80% [ 6], freeing time for supervisors to focus on service quality instead of repetitive paperwork.

- Financial savings. Research on shuttle optimization repeatedly shows reductions in operating costs (about 23% daily), fuel usage (roughly one-third annually), and maintenance spend (over 35%). In some cases, fleet sizes can be trimmed by 21–27% without reducing coverage [ 1], [2]. Even if actual results vary by context, the trend is clear: automated routing translates into tangible savings.

- Digital transformation.

Replacing spreadsheets, phone calls, and printed manifests with a secure SaaS system supports Ethiopia’s Digital Transformation Strategy 2025 [ 11]. By adopting an organizationscoped, layered architecture and a modern stack, organizations take a practical step toward becoming data-driven and innovation-ready .

- Environmental and social impact. Optimized routing leads to fewer kilometers driven, less fuel burned, and lower CO 2emissions [ 12]. The same architecture can eventually integrate electric vehicles and charging-station data, helping companies align with national green mobility goals. On the social side, dependable shuttle services expand workforce participation by enabling staff from a wider geographic spread to commute reliably .

### 1.6.2 Beneficiaries

The platform benefits multiple groups, each in different ways:

- Company executives. Lower costs and more eﬀicient asset use directly improve the bottom line, while dashboards surface KPIs for strategic decision-making.

- Shuttle planners and administrators. Routine route-building becomes automated. Dashboards highlight utilization, cost-per-trip, and on-time performance, giving staff an instant overview .

- HR and finance teams. Payroll exports are generated automatically from trip logs, cutting about six staff hours per week [ 6]. This also improves audit readiness and budgeting accuracy .

9 •Drivers. Clear stop lists and live navigation prompts reduce confusion. With fewer lastminute changes, drivers report less stress compared to paper-based coordination.

- Employees (riders). Commutes become more predictable, with travel times shortened by up to 15% [ 8]. Overcrowding is also reduced through better demand–capacity balancing.

- IT and operations staff. The system uses a modern, maintainable stack (React, Node.js, Prisma) built on a layered architecture. Application-level multi-tenancy and environmentbased configurations simplify management and ensure data isolation without the overhead of a complex microservice infrastructure.

- Environmental and social stakeholders. Reduced mileage contributes to cleaner air [ 12].

Dependable mobility options also widen access to employment opportunities, particularly in areas with limited transport.

### 1.6.3 Key Performance Indicators (KPIs)

Adoption should be measured with specific, repeatable metrics:

**Table 1:** .1: Key Performance Indicators for Platform Adoption

KPI Why It Matters Owner CadenceTarget (12 months) Onboarding timeIndicates ease of setup for new organizationsProduct Ops Per org50% faster vs.

baseline Scheduling exception rateReflects automation qualityOps Lead W eekly–30% in 6 months V ehicle utilization (%)Links directly to cost eﬀiciencyFleet ManagerMonthly +10–15% Y oY Payroll accuracy & reconciliation timeBuilds finance trust HR/Finance MonthlyReduce errors & save 6+ hrs/wk Authorization deny rate (unexpected)Signals permission/security healthSecurity DailyKeep denials minimal and explainable API error rate (5xx)Core reliability metricBackend/SRE Daily<1% across endpoints Mean time to detect (MTTD)Observability benchmarkSRE/Security Per incident <30 minutes These KPIs are not just technical; they tie adoption to tangible organizational outcomes. In 10 practice, they help ensure that the system remains both trustworthy and sustainable as usage scales.

### 1.6.4 Adoption Considerations & Risks

Rolling out Routegna successfully requires attention beyond the technology itself. Key considerations include:

- Roles and permissions. Misconfigured roles can frustrate users or create hidden security risks. Start with conservative role templates and refine them as teams gain experience.

- Data migration. Transferring historical trip records from spreadsheets or legacy systems must be carefully validated to prevent cross-tenant errors or data corruption.

- Operational readiness. Support teams should have runbooks and conduct simulation exercises before the platform goes live.

- Partner integrations. External APIs need to be tested in sandbox environments, with clear rate limits and service agreements.

- Observability gaps. Begin with logs and a small set of key metrics; gradually expand to full tracing and service-level objectives as the system matures.

### 1.6.5 Next Steps (Recommendations)

T o maximize impact and ensure smooth adoption, the following steps are recommended:

- Establish baseline KPIs. Measure initial performance during pilot rollouts to identify gaps and track improvements.

- Publish role templates. Provide default least-privilege templates to reduce configuration errors and accelerate onboarding.

- Create a data migration checklist. Ensure tenant imports are safe, validated, and auditable.

- Release a partner integration guide. Include sample payloads, expected responses, and error-handling instructions.

- Conduct incident tabletop exercises. Simulate potential issues to test alerts, escalation procedures, and response coordination.

11

# Chapter 2 — System and Software Requirements Specification (SRS)

2.1. Introduction / Overview

This chapter lays out the System and Software Requirements Specification (SRS) for Routegna, our platform aimed at streamlining corporate shuttle services. Building on the business case from Chapter 1, it defines what the system needs to do—both in terms of core functions and non-functional qualities like security, performance, and usability . Think of it as the blueprint that guides everything from design to testing, making sure everyone has a shared view of what success looks like.

The main goal is to spell out requirements clearly so stakeholders, from project supervisors to the development team, can see exactly how Routegna addresses real-world issues such as ineﬀicient routing, messy payroll, and lack of data visibility . It covers the scope of a webbased, multi-tenant tool designed for corporate fleets in congested urban areas such as Addis Ababa. References to key terms and assumptions are included, tying the specification back to the project’s overall aims and ensuring everything stays practical and traceable.

2.2. Current System (Existing Manual Workflow)

Up until Routegna, shuttle services were managed through a patchwork of manual steps that consumed time and created errors. The process exposed several critical weaknesses:

- Scattered Data & Manual Intake: Employees sent ride requests through whatever was handy—spreadsheets, emails, or even chat threads. This resulted in scattered data, duplicates, and no single master list for planning.

- Ineﬀicient Route Planning: Coordinators pieced together pickup points using Google Maps, relying more on guesswork than science. Planning a single shift could take one to two hours, often resulting in overloaded vans while others ran half empty . No structured history was captured for reuse or analysis.

- Static Communication: Drivers received assignments via static printouts or SMS, leaving them with little visibility into last-minute changes. Traﬀic jams, breakdowns, or shift swaps turned into a frenzy of phone calls that rarely reached everyone affected.

- Manual Payroll & Reconciliation Errors: The finance team reconciled hours, mileage, and invoices by hand. Payroll cycles dragged, with mismatches of 8–12% between hours billed and hours worked being typical.

In short, the manual process reflected the classic Employee Shuttle Routing Problem while also exposing bigger gaps: no real audit trail, no demand forecasting, and no access control. These 12 weaknesses directly shaped the requirements for Routegna’s automated solution.

**Figure 2:** .1: Existing Manual Workflow

2.3. Proposed System

The system we propose, Routegna, is meant to take over the existing manual process of handling shuttle operations. Instead of spreadsheets and fragmented tools, it introduces a web-based platform that is structured, modular, and role-specific. At the front it runs as a Single Page Application (SP A) that adapts to different user roles, while in the back it exposes REST APIs.

The architecture enforces tenant isolation, uses role-based access, and ties everything together through organization-scoped data handling.

13 Its main capabilities cover CRUD operations for vehicles, drivers, employees, and stops, route planning with Mapbox integration, a prototype clustering service for rider assignments, payrollready reporting, and in-app notifications. In addition, analytics dashboards are included for ongoing monitoring and improvements. The design breaks the system into modules, each with a clear boundary of responsibility, which helps both maintenance and extension in the future.

### 2.3.1 System Context and Actors

Several actors interact with the system, each with their own role, permissions, and responsibilities.

**Table 2:** .1: System Actors and Roles

Actor Details Super AdministratorDescription: Global operator managing demo data and onboarding tenants.

Key Needs: Provision tenants, seed catalogues, monitor health.

Organization AdministratorDescription: Manages vehicles, employees, and policies of one organization.

Key Needs: Maintain data, authorize managers, check reports.

Shuttle ManagerDescription: Handles daily routes and assignments of drivers.

Key Needs: Cluster riders, optimize routes, track utilization.

DriverDescription: Executes the assigned routes.

Key Needs: Access route manifests, follow stop order, pick up on time.

Finance/HR OﬀicerDescription: Manages payroll and reconciles records.

Key Needs: Generate exports, audit ride history, confirm payments.

Employee/RiderDescription: Requests shuttle services for commuting.

Key Needs: Submit requests, see pickup and timing details.

### 2.3.2 System Modules

The functions are divided into logical modules:

14

**Table 2:** .2: System Modules and Responsibilities

Module Responsibilities Authentication & Session•OAuth callbacks •Enforce sessions •T enant binding Organization & T enant Management•Store organizations •Enforce data scoping with organizationId Fleet & Resource Management•CRUD for vehicles, employees, drivers, and stops Route Planning & Visualization•Create/edit routes •Integrate with Mapbox •Editing flows in UI Clustering & Assignment•Use OR- T ools to group riders •Suggest assignments Payroll & Reporting•Aggregate trips •Calculate compensation •Produce finance-ready exports Analytics & Insights•Show KPIs and dashboards for utilization, cost, exceptions Notifications•Deliver in-app event notifications •Prepare for push features Audit & Compliance•Keep audit logs •Support GDPR export/delete •Help with compliance Infrastructure Services•Handle logging, rate limiting, configuration 15

### 2.3.3 Functional Requirements

**Table 2:** .3: Functional Requirements

ID Requirement FR-01 The system shall allow authorized administrators to manage (create, read, update, delete) vehicles, drivers, employees, and stops within their own organization.

FR-02 The system shall support the creation, editing, and publishing of shuttle routes with correctly sequenced stops.

FR-03 The system shall provide a mechanism to optimize the stop sequence for a given route by invoking the Mapbox Directions API.

FR-04 The system shall provide an automated clustering mechanism for suggesting riderto-vehicle assignments.

FR-05 The system shall allow authorized users to generate and export payroll-ready reports.

FR-06 The system shall enforce tenant isolation and Role-Based Access Control (RBAC) in all API calls.

FR-07 The system shall log critical user and system actions (e.g., route creation, payroll generation) to create an audit trail.

FR-08 The system shall provide in-app notifications to users for important, time-sensitive events.

FR-09 The system shall display an analytics dashboard with key metrics such as vehicle utilization, operational costs, and exceptions.

### 2.3.4 Non‐Functional Requirements

Performance •NFR-P1: Queries for up to 50 stops should return in ≤400 ms (95th percentile).

- NFR-P2: Clustering results returned in ≤30 seconds for standard workload.

Scalability •NFR-S1: Support 5–10 concurrent organizations without performance impact.

- NFR-S2: Services are designed to be container-friendly for scaling (stateless APIs, environmentbased configuration).

A vailability •NFR-A1: Maintain 99.5% uptime on core APIs.

- NFR-A2: Provide fallbacks for third-party outages (e.g., Mapbox).

Security •NFR-SEC1: Prevent cross-tenant leaks with strict filtering by organizationId.

- NFR-SEC2: Secure session management and protection of secrets.

- NFR-SEC3: Follow OW ASP guidelines to block common vulnerabilities.

16 Maintainability •NFR-M1: Keep modular design with separation of concerns to avoid heavy coupling.

### 2.3.5 Assumptions and Dependencies

- Organizations supply correct employee location data and vehicle capacity .

- Mapbox Directions API must stay available.

- OAuth provider (Fayda / Better Auth) continues to handle sessions securely .

- PostgreSQL instance is accessible with low latency .

- Current rate limiting is in-memory; Redis will be required for scaling.

- Privacy compliance (GDPR and similar) applies to handling of personal data.

### 2.3.6 Constraints

- T echnical: In-memory rate limiting limits scalability until Redis or another store is used.

- Regulatory: Employee location data must be managed according to privacy laws.

- Financial: Third-party APIs (Mapbox) add cost risks.

- Schedule: Academic deadlines restricted time for advanced clustering features.

- Infrastructure: Deployment is currently single-region with limited resources.

### 2.3.7 Acceptance Criteria / Success Metrics

**Table 2:** .4: Acceptance Criteria and Success Metrics

Metric Target Measurement Route planning time reduction≥50% faster than manualCompare coordinator time before/after deployment.

V ehicle utilization +10–15% average occupancyReview analytics dashboards and trip data.

Payroll reconciliation savings≥6 staff-hours per weekFinance review of export logs.

Unauthorized access 0 incidents Run automated security regression tests.

Notification acknowledgment≥80% acknowledged within 10 minutesCheck notification logs/telemetry .

2.4. System Models

In this part, the focus is on how Routegna behaves and how it is structured. The use case model gives a clear picture of the different actors in the system and what each of them can do to reach 17 their goals. Alongside that, the diagrams provide extra support by showing scope and the overall architecture in a more visual way . These models are not separate from the requirements; instead, they connect back to both functional and non-functional needs, making sure the design and the later implementation stay consistent with what was planned.

### 2.4.1 Use Case Diagrams

The main use case diagram for Routegna brings together all of the key actors and their interactions. Administrators, shuttle managers, drivers, finance or HR oﬀicers, and employees are each shown with the roles they play in the system. The diagram outlines how these actors use different features, whether that is managing resources, planning and assigning routes, generating payroll reports, or just requesting rides. Each link in the diagram has a direct relation to the earlier requirements, which makes it easy to trace back why a feature exists and who depends on it.

**Figure 2:** .2: Routegna Use Case Model

18 UC-001 Route Creation & Management Goal Enable a Fleet Manager to construct or adjust a route with full manual control while always being presented with an optimization recommendation (cluster + ordered stops) that can be accepted as-is, partially adjusted, or fully overridden.

Scope Operational route planning within a tenant for shifts, special deployments, VIP trips, or exception handling where managerial judgment may supersede algorithmic suggestions.

Description When a Manager initiates route creation (or edits an existing route), the system immediately requests an optimization recommendation from the Optimization Service. The recommendation bundles clustered rider groups and a suggested stop order together with capacity and travel metrics. This recommended plan is presented to the Manager for review—it never applies automatically . The Manager may accept it unchanged, accept it with edits, or reject it and compose a route manually . All edits trigger real-time validation (capacity, timing conflicts) and incremental metric recomputation.

Finalizing the route persists the final stop sequence, vehicle assignment and derived metrics, records an auditable snapshot of the original recommendation plus deviations, and makes the route available for dispatch, live tracking, payroll aggregation, and analytics.

Actors •Primary: Fleet Manager •Supporting systems/components: Optimization Service (FastAPI), V ehicle Inventory subsystem, Employee/Shift registry, Authentication provider (Better Auth / Fayda), Mapbox Directions (metrics enrichment), Notification/Dispatch (WebSocket hub), Prisma/PostgreSQL persistence.

Preconditions •Fleet Manager is authenticated via Better Auth (Fayda or federated provider).

- T enant context (organization) is resolved and Manager has route-creation permissions.

- V ehicles and employees for the target shift exist and are marked A V AILABLE.

- Optimization Service endpoint configured (if unreachable, the Manager proceeds with manual flow; heuristic metrics are available).

Trigger Manager selects Create New Route or Edit Route in the Route Management interface.

19 UC-001 Route Creation & Management (Scenario) Main Success Scenario 1. Manager opens the Create Route wizard.

2. Manager enters route metadata: name, service date, shift, route tags (e.g., VIP).

3. System sends a draft context (stops if pre-specified, target shift, candidate vehicles,

constraints) to the Optimization Service.

4. System concurrently performs metrics enrichment (Mapbox Directions) where possible.

5. System presents the Recommended Plan showing: proposed vehicle(s), clustered employee/stop groupings, ordered stop sequence, capacity/utilization metrics and travel

estimates.

6. Manager chooses one option:

- Accept Entire Recommendation, or •Accept with Adjustments (reorder stops, swap vehicle, add/remove stops, split/lock clusters), or •Reject Recommendation and build manually from the draft/pruned draft.

7. As Manager edits, the system validates vehicle capacity and timing, flags conflicts,

and recomputes incremental metrics in near real time.

8. Manager finalizes the route with explicit Finalize & Persist action.

9. System persists final stop sequence, vehicle assignment, derived metrics (distance,

duration, utilization), and an audit record including recommendation hash + deviation summary .

10. System transitions route state (e.g., DRAFT → ACTIVE or SCHEDULED) and, if

requested, triggers dispatch notifications to subscribed driver channels via WebSocket.

20 UC-001 Route Creation & Management (Extensions) Extensions / Alternate Flows •A1 — Optimization Service Timeout: system logs the timeout and displays “No recommendation available (timeout)”; Manager proceeds manually and may retry the recommendation request.

- A2 — Mapbox Metrics Unavailable: system substitutes heuristic metrics (straightline estimates or cached segment times) and clearly labels metrics as degraded.

- A3 — Capacity Breach Attempt: when an additive action causes capacity overflow, the system blocks the change and prompts for adjustment (select larger vehicle or remove assigned employees).

- A4 — V ehicle Swap After Edits: Manager changes vehicle; system revalidates capacity and recalculates utilization and travel metrics before allowing finalization.

- A5 — Partial Adoption / Locking: Manager may lock specific clusters/groups and request refined recommendations for the unlocked remainder; system records partial adoption percentages.

- A6 — Post-Persistence Modification: Manager edits an ACTIVE but not yet DISP ATCHED route; system versions the route (v2, v3, ...) and appends modification details to the audit log with a reference to the original recommendation anchor.

Business Rules •B1: A recommendation must never auto-apply without explicit Manager confirmation.

- B2: Capacity validation is real-time and blocking — the system must prevent saving a route that violates vehicle capacity constraints.

- B3: Any deviation from the recommended stop order is classified (swap, insertion, deletion) and recorded for analytics.

- B4: V ehicle changes after initial persistence require revalidation of time windows and dependent constraints.

- B5: Audit log entries must include: recommendation id/hash, acceptance mode (full/- partial/rejected), finalization timestamp, actor id, and a deviation summary .

21 UC-001 Route Creation & Management (NFRs & Data) Non-Functional Considerations •Responsiveness: initial optimization recommendation SLA target ≤5 s (p95).

- Observability: each optimization request is tagged with a correlation id for tracing and trend analysis.

- Security: all mutations are tenant-scoped; no cross-tenant references are permitted.

- Reliability: manual construction path must remain fully functional if external services degrade.

Data Captured (Persisted) •Route header: id, name, tenantId, shiftId, vehicleId, status.

- Stops: ordered index, employeeId (optional), lat/lon, arrival metadata.

- Metrics: totalDistance, totalDuration, utilizationRatio, recommendationV arianceScore.

- Audit: recommendationHash, acceptanceMode, deviatedStops[], modifiedBy, timestamps.

Audit & Traceability Each finalized route stores an immutable snapshot of the recommended plan and the final plan. The deviation summary enables offline analysis for optimization feedback loops and KPI measurement.

22

**Figure 2:** .3: Use Case Diagram for UC‐001

23 UC-002 Driver’s Daily Workflow & Live Updates Goal T o provide drivers with a real-time interface for their assigned routes and enable them to update progress as they complete stops.

Description This use case defines the daily workflow of a driver. Through the Driver Portal, they receive instructions, follow the route in order, and send updates back to the system, which keeps the Fleet Manager informed in real time.

Actors •Primary: Driver •Secondary: Fleet Manager Preconditions A dispatched route exists for the driver’s shift.

Main Success Scenario 1. Driver logs into the Driver Portal.

2. System displays assigned route with map and stop order.

3. At each stop, the Driver marks status as complete.

4. Each status update triggers a backend notification.

5. This process continues until all stops are done.

Extensions If the Fleet Manager modifies a route mid-shift, the system pushes an update to the Driver’s device, refreshing the route view instantly .

24

**Figure 2:** .4: Use Case Diagram for UC‐002

25 UC-003 Administrator Manages P ayroll Goal T o generate payroll reports based on aggregated driver and trip logs for a defined pay period.

Description This use case allows administrators to securely prepare payroll-ready reports from historical data. The reports may be reviewed on-screen or exported for use by the finance department.

Actors •Primary: Administrator Preconditions User authenticated as Administrator with financial rights.

Main Success Scenario 1. Administrator accesses the Payroll module.

2. Chooses pay period and parameters.

3. System aggregates relevant trip and driver records.

4. Aggregated data is displayed as a structured report.

Extensions Administrator can export the report into CSV or PDF format.

**Figure 2:** .5: Use Case Diagram for UC‐003

26 UC-004 System User Role Hierarchy Goal T o define the hierarchical Role-Based Access Control (RBAC) model that governs security and access.

Description This conceptual use case explains how roles are structured and how permissions cascade. Each higher role inherits from the base while adding its own capabilities, ensuring least-privilege access and proper segregation of duties.

Actors •System (RBAC engine) •All defined user roles Preconditions Active session established.

Role Breakdown •Base User: Can log in and view profile.

- Driver: Inherits Base User rights, plus can execute assigned routes.

- Fleet Manager: Inherits Base User rights, plus manages routes and fleet resources.

- Administrator: Inherits Fleet Manager rights, plus manages all user accounts and system settings.

27

**Figure 2:** .6: Use Case Diagram for UC‐004

28 UC-005 Asset & Resource Management Goal T o provide basic yet complete CRUD (Create, Read, Update, Delete) functions for the system’s key resources — vehicles, drivers, employees, and physical locations.

Description Accurate fleet management starts with clean data. In this use case, the Fleet Manager keeps the database updated by adding new assets, correcting records, or removing outdated ones. The point here is to make sure the resources stored in the system always match the actual state in the field.

Actors •Primary: Fleet Manager Preconditions The Fleet Manager must already be logged in.

Main Success Scenario (Add a New V ehicle) 1. The Fleet Manager goes to Manage V ehicles.

2. Chooses the Add New V ehicle option.

3. The system shows a form asking for vehicle details and its category .

4. Manager fills the form and submits.

5. The system saves the new entry in the assets database.

Extensions •Assign Driver to V ehicle: At any time, the Manager can link an existing driver to an existing vehicle.

- Update or Delete Assets: Old or wrong records can be edited or removed.

29

**Figure 2:** .7: Use Case Diagram for UC‐005

30 UC-006 Operational Reporting Dashboard Goal T o give the Fleet Manager access to a KPI dashboard and the option to run deeper performance reports.

Description This use case deals with how raw operational data is converted into useful information. The dashboard shows high-level performance measures — such as utilization rates or punctuality — so the Manager has an immediate sense of fleet status. If needed, detailed reports can also be generated through the analytics component.

Actors •Primary: Fleet Manager •Secondary: Analytics Service Preconditions Manager is logged in.

Main Success Scenario 1. The Manager opens the Analytics Dashboard.

2. The system displays KPIs (on-time performance, fleet usage, total distance, etc.).

3. Manager reviews the dashboard.

Extensions •Generate Detailed Report: Manager selects the report type, sets parameters, and the Analytics Service processes the request.

- Export Report: A completed report may be saved to PDF for distribution or later review .

31

**Figure 2:** .8: Use Case Diagram for UC‐006

32 UC-007 Authentication & Session Establishment Goal T o log users in via Fayda OAuth/Better Auth and start a session with the right organizational context.

Description This use case describes the login flow . Users are sent to the provider for authentication, then the system establishes a secure session when they come back.

Actors •Primary: User •Secondary: Authentication Provider Preconditions User must have valid credentials.

Main Success Scenario 1. User clicks login.

2. System redirects to the Auth Provider.

3. Provider validates and calls back.

4. Better Auth finalizes the session, sets cookies.

5. User is redirected into the client app.

Extensions •Refresh session.

- Logout when needed.

**Figure 2:** .9: Use Case Diagram for UC‐007

33 UC-008 T enant Context Management Goal T o keep the right organization scope active during a session.

Description For multi-tenant use, each session must be bound to one organization. This ensures requests and data always stay inside the correct tenant.

Actors •Primary: Administrator / Manager Preconditions Session already exists.

Main Success Scenario 1. User selects the active organization.

2. The system updates session context.

3. All API calls are scoped to that organization.

Extensions A UI organization switcher lets users change scope without logging out.

**Figure 2:** .10: Use Case Diagram for UC‐008

34 UC-009 Employee Onboarding & Stop Association Goal T o create employee records and link them to geographic stops.

Description Each employee must have a profile, and for routing to work, that employee must be tied to a stop with coordinates. This use case covers both steps: creating the record and linking the stop.

Actors •Primary: Fleet Manager / Administrator Preconditions •Organization is set up.

- User is logged in.

Main Success Scenario 1. Manager creates a new employee record.

2. Either creates a new stop or selects an existing one.

3. Stop is assigned to the employee.

4. Employee is now ready for routing.

Extensions •Bulk employee import.

- Update stop location if needed.

**Figure 2:** .11: Use Case Diagram for UC‐009

35 UC-010 V ehicle Availability Scheduling Goal T o mark vehicles available or unavailable for shifts.

Description Managers need to plan ahead which vehicles can be used. This use case allows them to pick dates and shifts and set availability, which helps later during assignment.

Actors •Primary: Fleet Manager Preconditions •V ehicles exist in the database.

- Shifts are configured.

Main Success Scenario 1. Manager chooses a vehicle.

2. Picks the shift and date.

3. Marks it as available.

4. System saves the status.

Extensions •Bulk update for multiple vehicles.

- Option to note a reason for unavailability .

**Figure 2:** .12: Use Case Diagram for UC‐010

36 UC-011 Single-Stage Route Optimization Goal T o generate route metrics (distance and time) for an ordered list of coordinates.

Description The use case takes a sequence of stops and produces an optimized path along with travel metrics, using Mapbox Directions as the external service.

Actors •Primary: Fleet Manager (through the system’s UI) •Secondary: Mapbox API Preconditions A valid route with a coordinate list is already assembled.

Main Success Scenario 1. User saves or edits an existing route.

2. The frontend invokes the optimizeRoute function.

3. Mapbox Directions API returns route geometry and travel metrics.

4. The system renders the metrics and route details in the UI.

Extensions •Adjusted duration heuristics may be applied when necessary .

- If required, a heuristic fallback is triggered.

**Figure 2:** .13: Use Case Diagram for UC‐011

37 UC-012 Clustering Invocation Goal T o cluster unassigned employees into groups matched with available vehicles.

Description The system groups employees based on their proximity and the capacity of available vehicles, aiming for eﬀicient route allocation.

Actors •Primary: Fleet Manager •Secondary: Clustering Service Preconditions Employee stops and vehicle availability are already recorded in the system.

Main Success Scenario 1. A POST request is made to the clustering endpoint with the relevant payload.

2. The service returns proposed clusters.

3. The UI displays these candidate groupings for review .

Extensions Clusters may be persisted and transformed into formal route assignments.

**Figure 2:** .14: Use Case Diagram for UC‐012

38 UC-013 Notifications Creation & Retrieval Goal T o create, store, and retrieve notifications for system users.

Description The system generates notifications in response to events such as updates or alerts. Users can later query and manage these notifications.

Actors •Primary: System •Secondary: User Preconditions The user is authenticated.

Main Success Scenario 1. An event or administrator action triggers notification creation.

2. User queries the notifications list.

3. User marks one or more notifications as read.

Extensions •Notifications may also be pushed via WebSocket.

- Expiration policies may be applied to older messages.

**Figure 2:** .15: Use Case Diagram for UC‐013

39 UC-014 Mapbox F ailure F allback Handling Goal T o maintain routing functionality when Mapbox Directions fails.

Description This use case ensures system resilience by using heuristics or cached data when the Mapbox API is unavailable.

Actors •Primary: Fleet Manager •Secondary: System Preconditions A network or Mapbox API failure is detected.

Main Success Scenario 1. The system detects a failed call to Mapbox Directions.

2. It triggers a nearest-neighbour heuristic.

3. An approximate path is computed and rendered, with a degraded state clearly indicated.

Extensions •Retry attempts may follow exponential backoff.

- Cached last-known routes may be provided if available.

**Figure 2:** .16: Use Case Diagram for UC‐014

40 UC-015 Documentation & Knowledge Synchronization Goal Keep documentation, rules, and tasks aligned with code updates.

Description Ensures that architecture documents, SDDs, and use cases reflect ongoing development changes.

Actors Engineering T eam Preconditions A code change or planning update occurs.

Main Scenario 1. Developer implements a change.

2. Documentation and artifacts are updated accordingly .

3. Updated documentation is reviewed and verified.

Extensions Automated checks for documentation freshness.

**Figure 2:** .17: Use Case Diagram for UC‐015

41 UC-016 Audit & Compliance Logging Goal T o provide immutable event logging for compliance and investigations.

Description The system records critical access and modification events, ensuring traceability for audits and security reviews.

Actors •Primary: Administrator •Secondary: Security Auditor Preconditions The audit subsystem is enabled.

Main Success Scenario 1. A user performs an action.

2. The event is logged with the actor, timestamp, and context.

3. The auditor retrieves, filters, or exports logs.

Extensions •T amper-evident hash chaining may be applied.

- Logs can be exported to an external SIEM.

**Figure 2:** .18: Use Case Diagram for UC‐016

42

### 2.4.2 Component and Architecture Diagram

The component diagram highlights the main system parts and their connections. The client is a React SP A (Vite) that communicates with a Node.js/Express API. Data is stored in PostgreSQL via Prisma, with organizationId enforcing tenant isolation. An optional FastAPI service provides clustering and route optimization experiments. External integrations cover routing (Mapbox Directions) and authentication, which supports multiple methods (OAuth, email/password, etc.) with flexibility to add new providers later. Solid arrows show the main REST/data flows, while dashed lines mark optional or future paths.

**Figure 2:** .19: High‐Level Component and Architecture Diagram

43 2.5. External Interface Requirements

**Table 2:** .5: External Interface Requirements

Interface Details Mapbox Directions API•Purpose: Provides travel geometry, times, and distances.

- Protocol: HTTPS REST (GET /directions/v5/mapbox/driving/{coords} with params like geometries, overview, steps).

- Notes: Requires VITE_MAPBOX_ACCESS_TOKEN; subject to rate limits.

FastAPI Clustering Service•Purpose: Groups employees into vehicle clusters.

- Protocol: HTTP REST (proxied via Express).

- Notes: Prototype feature; POST /clustering with JSON payload; runs locally .

Fayda OAuth (Authentication)•Purpose: Handles login and session issuance.

- Protocol: HTTPS OAuth2 (/api/auth/oauth2/callback/fayda).

- Notes: Default provider; extensible for Google, etc.

Internal REST API•Purpose: Main interface between client and backend.

- Protocol: HTTPS REST .

- Notes: T enant-scoped (organizationId), RBAC enforced, handles CRUD for all business modules.

44 2.6. Requirements Traceability Matrix

**Table 2:** .6: Requirements Traceability Matrix

Requirement ID & Summary Details FR-01 – CRUD for fleet assets•Modules: V ehicles, Employees, Stops •Status: Complete FR-02 – Route creation & publishing•Modules: Routes, Mapbox integration •Status: Complete FR-03 – Stop ordering optimization•Modules: Route planner, Mapbox •Status: Complete FR-04 – Clustering automation•Modules: FastAPI clustering, Express proxy •Status: Complete FR-05 – Payroll export•Modules: Payroll subsystem •Status: Complete FR-06 – T enant isolation & RBAC•Modules: Auth middleware, Prisma filters •Status: Complete FR-07 – Audit logging•Modules: Logging subsystem •Status: Partial FR-08 – Notifications•Modules: Notifications service •Status: Complete FR-09 – Analytics dashboard•Modules: Analytics module •Status: Planned 45 2.7. User Interface (UI) Mockups This section documents the key user interfaces of the Routegna platform. The designs served as the blueprint for development and were fully realized in the final React-based implementation.

Each interface emphasizes clarity, role-awareness, and task-centered usability, with responsive layouts that adapt across desktop and mobile devices.

The following subsections outline the primary views, accompanied by placeholders for Mockups.

Login Page A professional login screen featuring the company logo, a welcoming message, clean input fields for email and password, and a prominent Sign In button. An OAuth option for Fayda authentication is also available, alongside a tenant selection dropdown for multi-organization support.

**Figure 2:** .20: UI Mockup: Login Page

46 Administrator Dashboard A modern admin panel layout with a sidebar for navigation.

**Figure 2:** .21: UI Mockup: Administrator Dashboard

47 Route Planning View A data-focused management page that lists existing routes in a structured table. Columns include Route Name, Status, Driver, V ehicle, and Employee Count, with an Actions column for editing or deleting entries. Above the table, a search and filter bar is available, along with a clearly visible + Create New Route button.

**Figure 2:** .22: UI Mockup: Route Planning View

48 Driver Portal A simplified, mobile-optimized view designed for drivers.

**Figure 2:** .23: UI Mockup: Driver Portal

49 Payroll Report Page A reporting interface where administrators can select a date range and view aggregated trip and driver data. The main table summarizes totals by period, and users can export results through CSV or PDF options.

**Figure 2:** .24: UI Mockup: Payroll Report Page

50

# Chapter 3 — Design Specification Document

This chapter contains the Design Specification Document for Routegna. It translates the requirements from Chapter 2 into the concrete design decisions and blueprints used during implementation. The chapter is organised into the System Design Document (SDD), which covers high-level architecture and deployment concerns, and the Object Design Document (ODD), which covers package/module decomposition, class/interface detail, error handling, and UML diagrams.

3.1. System Design Document (SDD)

The SDD ties the system back to the requirements in the SRS and records the architectural reasoning that shaped the build. It covers the production architecture, subsystem decomposition, data strategy, deployment topology, and the major design trade-offs made during development.

### 3.1.1 Architectural Style (Layered & Microservice)

Routegna uses a hybrid model: a layered monolith handles the majority of business logic, while a separate FastAPI service performs clustering and assignment. This division keeps the main API straightforward to maintain, yet allows the optimization tasks to be scaled or tuned without affecting the rest of the platform.

- Client Layer — A React single-page application (SP A) delivering role-aware views (administrator, fleet manager, driver, employee). Layouts adapt responsively to desktop and mobile contexts. The client also includes a lightweight ‘routeOptimization‘ module to ensure responsiveness when editing routes. This module applies a nearest-neighbor TSP heuristic for provisional stop ordering, retries Mapbox Directions with progressively delayed intervals if a call fails, and gracefully falls back to a sequential HQ→Stops→HQ path with estimated metrics if Mapbox is unavailable.

- API Layer — Node.js / Express implements REST endpoints, orchestrates domain services, and enforces BetterAuth Organization middleware for authentication, RBAC, and tenant scoping. This layer proxies requests to external services (e.g., clustering, routing).

- Data Access Layer — Prisma ORM manages all interactions with the persistence layer, ensuring type safety and schema consistency .

- Persistence Layer — PostgreSQL serves as the primary datastore. T enant isolation is enforced through an ‘organizationId‘ filter across domain models, with additional protections applied in middleware.

- Optimization Services — The platform employs a two-tier approach to route optimization:

51 –Clustering Microservice (FastAPI): Handles multi-vehicle clustering and assignment. It groups employees or stops into vehicle buckets and produces an initial stop-order heuristic for each vehicle. It does not compute road network distances or ETAs; those are retrieved separately from Mapbox Directions.

–Client Pre-Optimization Heuristics: T o maintain responsiveness in the user interface, the client includes a lightweight ‘routeOptimization‘ module. This module:

1. Generates a provisional stop ordering for a single route using a nearest-neighbor heuristic.

2. Retries Mapbox Directions with progressively delayed intervals if a call fails.

3. Falls back to a simple sequential path (HQ → ordered stops → HQ) with estimated

metrics if external optimization is unavailable.

When a manager creates or edits a route, the clustering microservice is always invoked to produce a full cluster+ordering recommendation. The UI merges this authoritative recommendation with any provisional client result before presenting it to the manager. Once the recommendation is available, the manager can either approve it as-is, adjust specific parts such as reordering or reassigning stops, or replace it with a fully manual plan. Because the workflow integrates clustering from the server, heuristics from the client, and metrics from Mapbox, the system stays responsive, gives managers control, and produces a clear audit trail of decisions.

In practice, this setup lets the monolith handle everyday tasks eﬀiciently, while isolating the heavy clustering workload so it cannot slow down normal API responses. The client heuristics provide a safety net, keeping the interface usable even if external services are delayed.

52

**Figure 3:** .1: High‐Level Architectural View, illustrating the interaction between the client, API,

data layers, and external optimization services.

53

**Figure 3:** .2: Detailed Component Interaction Diagram, showing the flow of control and data

between controllers, middleware, services, and the persistence layer.

54

**Figure 3:** .3: Multi‐Fleet Workflow Activity Diagram, detailing the end‐to‐end process from a

manager initiating route creation to final plan persistence.

55

### 3.1.2 Subsystem Decomposition

The system is decomposed into a set of bounded subsystems. Each subsystem owns discrete responsibilities, exposes a clear integration surface (synchronous APIs and/or asynchronous events), and persists or caches the data it requires. The decomposition supports independent evolution, targeted scaling, and straightforward operational ownership.

**Table 3:** .1: Subsystem Decomposition and Responsibilities

Subsystem Details Client (Frontend)•Responsibilities: User interfaces for route planning, dashboards, driver workflows and employee self-service; local pre-optimization heuristics to keep the UI responsive; Mapbox rendering and interaction.

- Interfaces: HTTPS REST to /api/* , WebSocket/SSE channels for live updates, and an internal routeOptimization module for provisional ordering.

- Owned artifacts: Transient UI state, provisional route orderings and client caches.

API / Application Backend•Responsibilities: Domain orchestration, validation, tenant scoping, RBAC enforcement, CRUD for canonical domain objects, acceptance and normalization of optimization artifacts, and exposition of background jobs and worker triggers.

- Interfaces: REST endpoints ( /api/routes ,/api/vehicles , etc.), WebSocket endpoints, and internal proxy routes to the Optimization Service ( /fastapi/* ).

- Owned artifacts: Canonical domain records (Routes, Employees, V ehicles, PayrollRuns, etc.).

Optimization Service (FastAPI)•Responsibilities: Multi-vehicle clustering and assignment; generate cluster proposals and initial intra-vehicle stop orderings. The service does not compute road network geometry, distances, or ETAs.

- Interfaces: POST /clustering ; ephemeral caching of run artifacts in Redis for hot retrieval.

- Owned artifacts: Ephemeral run identifiers; durable records are persisted by the API layer.

Continued on next page 56 Subsystem Details Mapbox & External Routing•Responsibilities: Authoritative route geometry, distance, and ETA metrics for an ordered coordinate sequence.

- Interfaces: Mapbox Directions/Matrix endpoints.

- Owned artifacts: Cached direction results (Redis) and persisted metric snapshots (DB) where needed.

Notifications & Realtime•Responsibilities: In-app notification generation, WebSocket fanout to drivers and admins, and fallback delivery via Email/SMS.

- Interfaces: /api/notifications , WebSocket channels, outbound email/SMS connectors.

- Owned artifacts: Notification records and delivery receipts.

Payroll & Analytics•Responsibilities: Aggregate completed routes and telemetry into payroll runs and KPI surfaces; materialize views to support dashboards.

- Interfaces: /api/payroll ,/api/analytics and scheduled worker jobs.

- Owned artifacts: PayrollRun snapshots, materialized views (VehicleUtilizationView ).

Auth & T enant Management•Responsibilities: Session lifecycle, RBAC, tenant context binding and provisioning. Sessions and claims are validated via the BetterAuth Organization model.

- Interfaces: /api/auth/* , session cookies, and authentication hooks for WebSocket handshakes.

- Owned artifacts: Users, Roles, Sessions, T enant records.

Audit & Compliance•Responsibilities: Immutable logging of critical actions, compliance exports, and SIEM integration.

- Interfaces: /api/audit/* and export utilities.

- Owned artifacts: Append-only AuditEvent ledger (hashchained).

Integration and Orchestration Patterns Synchronous user flows use HTTPS REST between client and API; clustering requests are always issued to the Optimization Service when a manager creates or edits a route. Metric en57 richment (Mapbox) is performed in parallel; the UI merges server recommendation and client provisional heuristics before presenting the combined candidate plan for managerial review .

Asynchronous processing uses Redis streams/BullMQ for durable queues: payroll aggregation, notification fan-out, plan persistence, and analytic materialization are handled by worker processes. Data ownership is explicit: the API layer owns durable persistence; the Optimization Service remains stateless for scaling and testability .

58

**Figure 3:** .4: Subsystem Component View showing data ownership and key interactions.

59

### 3.1.3 Data Persistence and Schema Design

This section defines the authoritative persistence architecture, multi-tenancy mechanics, entity model boundaries, optimization artifacts, indexing and performance strategy, and operational guarantees. The contents below are intended for inclusion in the SDD (conceptual and operational design); detailed table/DDL fragments belong to the ODD or implementation appendices.

Persistence strategy •Primary store: PostgreSQL is the canonical system of record. All domain mutations pass through the service layer and Prisma ORM; ad-hoc SQL in business logic is avoided. Migrations are managed by Prisma Migrate under CI with shadow DB drift detection.

- Caching & queues: Redis is used for short- TTL distance/duration matrix fragments (keyed by ‘organizationId‘ + scopeHash), provisional clustering outputs prior to acceptance, hot lookups (recent routes, unread notification counts), and lightweight job orchestration (Redis streams / BullMQ).

- Optimization service persistence model: The FastAPI clustering microservice is stateless and emits proposals (ClusterPlan payloads containing vehicle assignments, candidate orderings and cost metrics). The API layer normalizes those proposals and persists them as ClusterPlan and optional RecommendationDiff rows. Redis stores hot matrices and transient plans for quick retrieval.

60

**Figure 3:** .5: Core Operational ERD ‐ 1

61

**Figure 3:** .6: Optimization ERD ‐ 2

62

**Figure 3:** .7: Observability & Analytics ERD ‐ 3

63 Core Logical Entities •Organization —organizationId (PK), name ,status •User —userId (PK),organizationId , email ,role ,status •Employee —employeeId (PK), organizationId ,userId? ,employmentType , shiftGroup ,status •V ehicle —vehicleId (PK),organizationId , category ,capacity ,status •Stop —stopId (PK),organizationId , latitude ,longitude ,pointGeom (generated),address •Route —routeId (PK),organizationId , vehicleId? ,clusterPlanId? ,routeDate , status ,version •RouteStop —routeStopId (PK), routeId ,stopId ,sequence ,planned/actual timestamps ,eta ,distance •EmployeeStop — PK ( employeeId , stopId ,organizationId ),validFrom , validTo ,active•ClusterPlan —clusterPlanId (PK), organizationId ,generatedAt ,optimizerVersion , hash ,planType ,scopeHash •RecommendationDiff —diffId (PK), routeId ,organizationId , provisionalHash ,recommendedHash , accepted ,createdAt •PayrollRun —payrollRunId (PK), organizationId ,periodStart ,periodEnd , totalHours ,totalAllowance ,status , checksum •V ehicleUtilizationView — materialized view:vehicleId ,organizationId ,date , utilizationPct •Notification —notificationId (PK), organizationId ,userId ,type , severity ,read ,createdAt •AuditEvent —auditEventId (PK), organizationId ,actorUserId ,entityType , entityId ,action ,timestamp ,integrityHash , previousHash Integrity Rules and Constraints (Selection) •T enant composite FKs: All tenant-scoped foreign keys include organizationId to prevent cross-tenant FK resolution.

- Unique constraints: e.g.,UNIQUE (organizationId, routeDate, vehicleId) enforces one vehicle per route per day; UNIQUE (organizationId, hash) guardsClusterPlan uniqueness.

- Sequence constraints: UNIQUE (routeId, sequence) onRouteStop plus application validation to ensure contiguous sequences.

- Accepted diff constraint: Partial unique index to ensure at most one RecommendationDiff perRoute hasaccepted = TRUE .

64 •Audit chain: Trigger or background job validates previousHash continuity to enforce appendonly integrity .

Indexing and Performance Strategy •Tactical composite indexes: (organizationId, status, routeDate) onRoute ;(routeId, sequence) onRouteStop ; partial index for recent unaccepted RecommendationDiff entries.

- Spatial indexing: GiST/SP-GiST onStop.pointGeom (PostGIS) for geospatial queries; geohash used for coarse prefiltering.

- JSONB strategy: Parameters and cost metrics persist in JSONB ;GIN indexes are added only for frequently queried JSON keys.

- Materialized views: Incremental refresh after route completion or on schedule to support dashboards ( VehicleUtilizationView ).

- Hot path caching: Cached distance matrices keyed by (organizationId, scopeHash) in Redis to serve repeated reclustering scenarios.

Transactions, Idempotency, and Concurrency •Atomic publication: Publishing a Route is an atomic transaction bundling Route ,RouteStops , optional accepted RecommendationDiff , andClusterPlan link.

- Optimistic concurrency: Route.version supports compare-and-swap for resequencing; clients refresh projections on conflict.

- Idempotency: Cluster submissions include (organizationId, scopeHash, planType) to short-circuit duplicate work and return cached plans.

Backup, Retention, and Recovery •Backup policy: Nightly base backups + continuous W AL archiving for PITR; automated monthly restore drills.

- Retention defaults: AuditEvents 12 months (configurable), Notifications 90 days, optimization artifacts 90 days with optional archival to object storage.

- RPO/RTO targets: RPO < 5 minutes (W AL), RTO < 30 minutes (documented runbooks and DR procedures).

Schema Migration and Deployment •Migration flow: Prisma Migrate executed in CI with a shadow DB; migrations applied with blue/green or rolling strategies where needed.

65 •Safe change patterns: Add nullable columns first; backfill with workers; migrate to NOT NULL only after parity . Emergency rollbacks use compensating migrations where forward fixes are impractical.

### 3.1.4 Deployment and Runtime View

This section describes how Routegna is packaged, deployed, scaled, observed, and operated across environments. All deployable units are produced as container images via CI (multi-stage Docker builds). Infrastructure is defined as code (Helm charts + environment overlays). The runtime topology, scaling rules, and operational controls reflect the production posture and the staging/development topologies used for validation.

Environment T opologies

**Table 3:** .2: Environment Topologies

Environment T opology Summary & Purpose Development Localdocker-compose stack: API (Node/T ypeScript), FastAPI (Python), Postgres (single instance), Redis (single), MailHog (SMTP capture), optional OpenAPI UIs.

Purpose: rapid iteration, hot reload, local prototyping; minimal security hardening.

Staging Single-region Kubernetes: API Deployment (HP A), FastAPI Deployment, W orker Deployment, WebSocket-enabled API pods, managed HA Postgres, Redis, LaunchDarkly client, OpenT elemetry collector, ingress with TLS.

Purpose: pre-production validation—integration, load & migration rehearsals; blue/green and canary tests.

Production Multi-AZ Kubernetes: autoscaling API pods, dedicated WebSocket gateway, isolated FastAPI deployment, worker pool (queue consumers), CronJobs; HA Postgres cluster (primary + read replicas), Redis Cluster/Sentinel, External DNS + Ingress (TLS), OT el Collector → Prometheus + Trace Exporter + SIEM, secrets manager (V ault/KMS).

Purpose: high availability, resilience under zone loss, audited operations with controlled change windows.

Runtime Components and Scaling 66

**Table 3:** .3: Runtime Components and Scaling Characteristics

Component Responsibility / Scaling Characteristics API Service (Node/TS)REST endpoints, orchestration, auth, persistence, WS auth. HP A by CPU + latency; stateless (session state and caches in Redis).

W ebSocket Gateway Real-time route/notification push and driver telemetry . Scales independently for fan-out; connection-sticky ephemeral state.

FastAPI Optimization ServiceClustering + ordering computations (stateless compute). Scales on CPU and queue depth; consumes Redis matrices; applies backpressure when overloaded.

W orker Processes Payroll aggregation, materialized view refresh, diff acceptance, exports. Queue-depth scaling (BullMQ / Redis streams); stateless.

Redis Caching (distance/duration matrices, hot plans), queue + stream backend. Clustered/sharded; stateful.

PostgreSQL System of record (multi-tenant). HA primary + replicas; stateful; RLS applied for tenant enforcement.

Observability Stack Metrics, traces, logs ( OTel Collector →Prometheus / SIEM ).

Horizontally scalable collectors; ephemeral ingestion nodes.

Feature Flag Client LaunchDarkly SDK embedded; stateless; safe-mode defaults if SDK unavailable.

Deployment Workflow (CI/CD Summary) •Developer push → CI runs lint, tests, type-check, Prisma migrations (shadow DB).

- Build images (multi-stage) → SBOM + vulnerability scan.

- Push→ Staging Helm release (rolling / blue/green).

- Automated integration + synthetic routing load/regression tests.

- Manual approval → Production Helm release (gradual canary subset).

- Post-deploy smoke tests: health, auth, route creation, clustering run.

- Canary metrics observed: error rate, p95 latency, queue depth, etc.

- Auto rollback triggers: sustained 5xx above SLO, queue backlog > threshold, auth error spike, clustering timeout surge.

67 Resilience & Recovery Patterns

**Table 3:** .4: Resilience and Recovery Patterns

Scenario Strategy FastAPI pod exhaustion HP A + queue backpressure; graceful degraded response.

Redis node failure Sentinel/cluster failover; reconnect logic with exponential backoff.

Postgres primary loss Provider/Patroni automatic promotion; connection retry and failover.

Route publish concurrency Optimistic CAS on Route.version ; client receives 409 with latest projection.

Distance matrix cache stampedeSingle-flight request coalescing, TTL jitter, and scopeHash invalidation.

Feature flag outage Local bootstrap defaults; fail-open (configurable safe-mode).

W ebSocket overload Backpressure + prioritized delivery + degrade to polling fallback.

W orker backlog surge Scale worker pool; shed low-priority jobs if SLA at risk.

Plan recomputation storm Cache keyed by (orgId, scopeHash, planType) ; early return on duplicates.

Observability & Operations •Metrics: latency (p50/p95/p99), throughput, queue depth, success rates, replica lag.

- Tracing: cross-service (API ↔ FastAPI ↔ Redis) with W3C / OT el context.

- Logging: structured JSON including correlation ID and organizationId .

- Alerting: SLO burn, queue lag, optimization failure ratio, replication lag, WebSocket disconnect spikes.

- Audit: immutable AuditEvent hash chain; nightly integrity re-hash job.

- Security: non-root containers, PoLP , network policies, sealed secrets/V ault, DB RLS.

- Compliance: trace & audit export endpoints gated to admin roles.

High-Level Runtime Flow (Example) Client requests optimization → API checks cache → enqueues clustering → FastAPI computes plan and stores in Redis → API persists ClusterPlan 68 → UI merges results → manager accepts/adjusts → final route persisted → workers refresh views asynchronously .

### 3.1.5 Key Decisions and Trade‐offs

**Table 3:** .5: Key Design Decisions and Trade‐offs

Decision Rationale / Trade-offs / Mitigations Hybrid modular monolith + isolated optimization microserviceRationale: core remains cohesive; Python ecosystem leveraged for solvers; clustering scales independently . T rade-offs: crossservice latency . Mitigations: Redis colocation, circuit breakers, cache of recent plans.

Shared multi-tenant Postgres (single schema)Rationale: simpler ops, eﬀicient use, unified analytics. T radeoffs: noisy-neighbor risk. Mitigations: RLS (deny by default), composite FKs, pooling, future shard thresholds.

Session-based auth + multiIdP federationRationale: strong tenant binding and extensibility . T rade-offs:

Redis session dependency . Mitigations: hardened Redis, secret rotation, secure cookie attributes.

Prisma ORM + disciplined migrationsRationale: type safety, developer velocity, CI validation.

T rade-offs: abstraction overhead. Mitigations: raw SQL escape hatches, query plan monitoring.

Redis as cache + queue Rationale: operational consolidation. T rade-offs: workload contention. Mitigations: keyspace separation, monitoring, option to split later.

RecommendationDiff history modelRationale: supports rollback and audit trail. T rade-offs: extra storage. Mitigations: partial indexes, TTL/archival cleanup jobs.

Optimistic concurrency (Route.version )Rationale: scales without locking. T rade-offs: clients must retry on 409 conflicts. Mitigations: retry backoff with jitter, clear error semantics.

Materialized views for analyticsRationale: offload OL TP , stable dashboards. T rade-offs: eventual consistency . Mitigations: event-driven + scheduled refresh; SLA staleness windows.

Distance matrix caching (scopeHash )Rationale: reduce recomputation cost & latency . T rade-offs:

staleness risk. Mitigations: deterministic invalidation, TTLs, hash verification.

69 Decision Rationale / Trade-offs / Mitigations Feature flag system (LaunchDarkly)Rationale: progressive delivery, safe rollouts. T rade-offs: external dependency risk. Mitigations: local fail-open safe-mode defaults and short SDK timeouts.

Immutable ClusterPlan post-activationRationale: reproducibility, audit integrity . T rade-offs: new plan required for changes. Mitigations: plan lineage via scopeHash /planType , diffs for changes.

Monorepo (pnpm workspaces)Rationale: shared types, unified CI. T rade-offs: larger build graph. Mitigations: incremental caching, parallel execution, selective CI triggers.

Deferred T opics

**Table 3:** .6: Deferred Topics and Revisit Triggers

T opic Current Stance; Revisit Trigger Sharding / partitioning Deferred; revisit when route volume or hotspots exceed thresholds.

CQRS read-model split Deferred; revisit if OL TP latency is degraded by analytical load.

Outbox / CDC events Planned; revisit when integrations exceed a configured threshold.

Column-level encryption Deferred; revisit if tenant compliance requirements escalate.

Principles Reinforced •Immutability for audit-critical artifacts ( ClusterPlan lifecycle).

- Layered performance path: cache → compute → persist→ derive.

- Observability gating deployments (no release without core metrics).

- Fail-fast and degrade gracefully with explicit signals.

- Backward-compatible additive schema migrations.

Summary The deployment and runtime model optimizes for operational clarity, resilience, and controlled complexity—keeping the core cohesive, isolating only compute-heavy optimization, and deferring heavier distributed patterns until scale clearly demands them.

70 3.2. Object Design Document (ODD) This section specifies the object-level design that implements the SDD. Conventions: PascalCase for classes, camelCase for methods, DTOs derived from Prisma schema, validation via Zod (executed at ingress and internal boundaries).

### 3.2.1 Package and Module Decomposition

**Table 3:** .7: Package and Module Decomposition

Package / Module Responsibilities & Key Dependencies Bootstrap (server/src/app.ts )Compose Express app, register middleware (BetterAuth Organization middleware), mount routes, init WebSocket hub. Depends:

express ,@better-auth ,pino ,ws.

Middleware (server/src/middleware/ )Auth, RBAC, tenant scoping, validation, error translation. Injects organizationId into request context. Uses zod , shared error types.

Routes / Controllers (server/src/routes/ )Thin HTTP → service adapters for /routes ,/employees , /vehicles ,/payroll ,/notifications ,/analytics .

Services (server/src/services/ )Domain orchestration: RouteService , ClusteringOrchestrator , NotificationService , PayrollService ,AnalyticsService ,AuditLedger . Integrates Prisma, Redis, Mapbox, FastAPI client.

Jobs / Workers (server/src/jobs/ )Queue processors (BullMQ / Redis streams): payroll, MV refresh, notification fan-out, cluster recompute. Idempotent handlers and DLQ.

Prisma (server/prisma/ )DB schema, migrations, seed scripts, generated types used as canonical DTOs.

Shared Contracts (packages/shared/ )DTOs, validation schemas and helpers (derived from Prisma) to keep client/server parity .

Client (packages/client/src )React SP A: RouteAssignmentWizard , Map components, Driver views, Notification drawer, KPI dashboards, localrouteOptimization heuristic. Depends: react , tanstack-query ,mapbox-gl .

Config (packages/shared/config )Env loaders, LaunchDarkly client config, logging settings, secrets wiring.

### 3.2.2 Key Class and Interface Descriptions

71

**Table 3:** .8: Key Backend Class and Module Interfaces

Class / Module Key methods, purpose, representative exceptions AuthService authenticate(code) ,verifySession(sessionId) . Handles OAuth callbacks, sessions, BetterAuth Organization binding. Exceptions: AuthenticationError ,UnauthorizedError .

T enantContextMiddleware resolve(req,res,next) . Injects organizationId for RLS; validates tenant. Exceptions: TenantNotFoundError .

RouteService createRoute(draft) ,acceptRecommendation(routeId, planId) , updateRoute(routeId,patch) , dispatchRoute(routeId) . AL W A YS invokes clustering orchestrator, merges client heuristic, requests metrics, persists RecommendationDiff /ClusterPlan , enforces optimistic concurrency via version . Exceptions: ValidationError ,CapacityExceededError , DiffConflictError ,RouteNotFoundError .

ClusteringOrchestrator requestPlan(scope) . HTTP adapter to FastAPI clustering microservice — returns vehicle →employee assignments and initial ordering. Does NOT compute map directions/ETAs. Exceptions:

OptimizationTimeoutError ,ClusterGenerationError .

NotificationService create(dto) ,markRead(userId,ids) ,fanOut(event) . Persist + dispatch via WS/SSE/email fallback. Exceptions:

DeliveryError .

PayrollService runPayroll(tenantId,period) , export(tenantId,period,format) . Aggregate trips, create PayrollRun , export CSV/PDF. Exceptions:

PayrollRunExistsError ,ExportGenerationError .

AnalyticsService getKpi(tenantId) , refreshMaterializedViews() .

Query materialized views; cache snapshots. Exceptions:

AnalyticsUnavailableError .

AuditLedger append(event) ,query(filters) . Append-only hash-chained events. Exceptions: IntegrityViolationError .

72

**Table 3:** .9: Key Frontend Component Contracts

Component / Module Public hooks / props & purpose RouteAssignmentWizard useRecommendation() ,onAccept(plan) ,onAdjust(diff) — route creation UI: metadata → recommendation → manual override → persist.

NotificationDrawer useNotifications() ,markSeen(ids) — live drawer; WS primary, SSE fallback.

PayrollReportPage usePayrollRun(period) ,export(format) — payroll generation and export.

DriverPortal useAssignedRoute() ,updateStopStatus(stopId,status) — mobile map + ordered stops + status updates.

**Table 3:** .10: Domain Entity Snapshot

Entity Core Fields Route routeId, organizationId, vehicleId, routeDate, status, version RouteStop routeStopId, routeId, stopId, sequence, plannedArrivalTime ClusterPlan clusterPlanId, organizationId, hash, planType, scopeHash RecommendationDiff diffId, routeId, provisionalHash, recommendedHash, accepted PayrollRun payrollRunId, organizationId, periodStart, periodEnd, totalHours Notification notificationId, userId, type, severity, read AuditEvent auditEventId, entityType, integrityHash, previousHash

### 3.2.3 Error Handling and Exception Strategy

**Table 3:** .11: Error Handling and HTTP Status Codes

Error Handling & HTTP code ValidationError 400 — return structured RFC7807 response; client fixes input.

CapacityExceededError 409 — present to user; allow corrective edit.

73 Error Handling & HTTP code RouteNotFoundError 404 — inform user; no retry .

DiffConflictError 409 — return latest projection; client must reapply changes.

OptimizationTimeoutError 503 — surface degraded UI; client heuristic used.

ClusterGenerationError 503 — fallback to client heuristic; queue retry .

ExternalServiceError 502/503 — circuit breaker; retry policies; degrade gracefully .

PersistenceError 500 — alert ops; retry where idempotent.

IntegrityViolationError 500 — escalate; critical.

Propagation rules •Controllers: attachcorrelationId +organizationId , pass to central ErrorMiddleware .

- Services: raise domain-specific DomainError objects with code ,message ,details .

- Repositories: wrap DB/network errors into PersistenceError orExternalServiceError .

- W orkers: idempotent retries with backoff; DLQ for persistent failures.

- Client: map server problems into AppError with i18n keys and friendly UI text.

Canonical Error Example (RFC7807) { "type": "https://docs.routegna.dev/errors/validation", "title": "Validation Error", "status": 400, "code": "VALIDATION_ERROR", "correlationId": "c6f9b5a2-...", "organizationId": "org_123", "details": [ { "field": "routeDate", "message": "Must be in YYYY-MM-DD format" } ] }

### 3.2.4 UML Diagrams

The following diagrams visually represent the system’s object-level design and runtime behavior, translating the architectural principles into concrete implementation models. They are categorized into structural diagrams, which illustrate the static relationships between components, and sequence diagrams, which detail key dynamic interactions.

74 Architectural & Structural Diagrams

**Figure 3:** .8: Component Diagram: Application Services & Infrastructure Dependencies

75

**Figure 3:** .9: Class Diagram: Domain Entities & Relationships

76

**Figure 3:** .10: Layer Diagram: Service & Infrastructure Layers

77

**Figure 3:** .11: Package Diagram: Backend

78

**Figure 3:** .12: Component Diagram: Frontend Component Hierarchy

79

**Figure 3:** .13: Data Flow Diagram: Frontend Architecture

80 Sequence Diagrams

**Figure 3:** .14: Sequence Diagram: Create Route with Clustering

81

**Figure 3:** .15: Sequence Diagram: Notification Delivery

82

**Figure 3:** .16: Sequence Diagram: Vehicle‐to‐Route Assignment

83

**Figure 3:** .17: Sequence Diagram: Editing an Existing Route

84

**Figure 3:** .18: Sequence Diagram: Employee Assignment to Routes

85

**Figure 3:** .19: Sequence Diagram: Adding a New Vehicle

86

**Figure 3:** .20: Sequence Diagram: Payroll and Analytics Process

87

# Chapter 4 — Implementation Report

4.1. Development Environment and Technology Stack

4.2. Implementation of Key Modules and Algorithms

### 4.2.1 Core Backend Service Implementation (Node.js/Express)

### 4.2.2 Optimization Service Implementation (Python/FastAPI)

### 4.2.3 Frontend Application Implementation (React)

4.3. Code for Major Functionalities (Annotated Snippets)

4.4. Testing Specification and Reports

### 4.4.1 Unit Testing

### 4.4.2 Integration Testing

### 4.4.3 End‐to‐End (E2E) Testing

### 4.4.4 Test Results Summary

88 References [1] F. Altıparmak and I. Kara, “Employee shuttle bus routing problem,” in Proc. 5th Int.

Conf. Ind. Eng. Oper. Manage. , Dubai, UAE, Mar. 2020. [Online]. A vailable: https:

//www.researchgate.net/publication/341726808_Employee_Shuttle_Bus_ Routing_Problem .

[2] M. M. A ydın, E. Sokolovskij, P . Jaskowski, and J. Matijošius, “Service management of employee shuttle service under inhomogeneous fleet constraints using dynamic linear programming: A case study,” Appl. Sci. , vol. 14, no. 9, p. 3604, 2024. [Online]. A vailable:

https://www.mdpi.com/2076-3417/15/9/4604 .

[3] V . Pillac, M. Gendreau, C. Guéret, and A. Medaglia, “ A review of dynamic vehicle routing problems,” European Journal of Operational Research , vol. 225, no. 1, pp. 1–11, 2013. [Online]. A vailable: https://hal.science/hal-00739779v1/document .

[4] Wikipedia, V ehicle routing problem , Jul. 2023. [Online]. A vailable: https://en.

wikipedia.org/wiki/Vehicle_routing_problem .

[5] Q. W ang and J. Holguín- V eras, “ A tour-based urban freight demand model using entropy maximization,” in Presented at the 91st Annual Meeting of the T ransportation Research Board , W ashington D.C., 2012. [Online]. A vailable: https://onlinepubs.trb.org/ onlinepubs/shrp2/c20/015atour-based.pdf .

[6] Aptean, Aptean Routing & Scheduling Case Study: George’s , Apr. 2021. [Online]. A vailable:https://www.aptean.com/en-US/insights/success-story/paragonssoftware-helps-georges-deliver-fleet-and-fuel-savings .

[7] P . K. Akkah, E. K. K. Sakyi, and J. K. Panford, “Multi-tenancy in cloud native architecture: A systematic mapping study,” in Proc. 2021 IEEE 14th Int. Conf. on Cloud Computing (CLOUD) , 2021, pp. 248–252. [Online]. A vailable: https://pure.port.ac.

uk/ws/portalfiles/portal/70449994/Multi_tenancy_in_cloud_native_ architecture_PDF.pdf .

[8] G. Peker and D. Türsel Eliiyi, “Employee shuttle bus routing problem: A case study,”

Avrupa Bilim ve T eknoloji Dergisi , no. 46, pp. 151–160, 2023. [Online]. A vailable: https:

//dergipark.org.tr/en/download/article-file/2641311 .

89 [9] F. Jamshidi, C. Pahl, N. Cito, and N. Medvidovic, “Microservices: The journey so far and challenges ahead,” IEEE Software , vol. 35, no. 3, pp. 24–35, May 2018. DOI: 10.1109/ MS.2018.2141039 . [Online]. A vailable: https://doi.org/10.1109/MS.2018.

2141039 .

[10] C. Lin, K. L. Choy, G. T . S. Ho, S. H. Chung, and H. Y . Lam, “Survey of green vehicle routing problem: Past and future trends,” Expert Systems with Applications , vol. 41, no. 4, pp. 1118–1138, 2014. DOI: 10.1016/j.eswa.2013.07.107 . [Online]. A vailable:

https://doi.org/10.1016/j.eswa.2013.07.107 .

[11] Ministry of Innovation and T echnology, Ethiopia, “Digital ethiopia 2025: A strategy for ethiopia’s digital transformation,” Ministry of Innovation and T echnology, Addis Ababa, Ethiopia, T ech. Rep., 2020. [Online]. A vailable: https://www.lawethiopia.com/ images/Policy_documents/Digital-Ethiopia-2025-Strategy-english.pdf .

[12] S. Erdoğan and E. Miller-Hooks, “ A green vehicle routing problem,” T ransportation Research P art E: Logistics and T ransportation Review , vol. 48, no. 1, pp. 100–114, 2012.

DOI:10.1016/j.tre.2011.08.001 . [Online]. A vailable: https://hal.science/ hal-03182944v1/document .

90 Appendix A – User Manual 91 Appendix B – Data Collection Methods and Tools 92 Milestones 93

