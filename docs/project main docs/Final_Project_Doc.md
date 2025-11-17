HiLCoE
School of Computer Science and Technology
# ENTERPRISE FLEET MANAGEMENT PLATFORM
# SENIOR PROJECT FINAL DOCUMENT
Prepared by:
# LEUL TEWODROS AGONAFER
# LEUL YARED ASSEFA
# KIDUS MESFIN MEKURIA
September 2025

# AN ENTERPRISE CLOUD FLEET MANAGEMENT PLATFORM WITH
# ADAPTIVE ROUTING, DYNAMIC PASSENGER POOLING & PREDICTIVE
# FORECASTING
Prepared by:
# LEUL TEWODROS AGONAFER
# LEUL YARED ASSEFA
# KIDUS MESFIN MEKURIA
# A SENIOR PROJECT DOCUMENT SUBMITTED TO THE
# UNDERGRADUATE PROGRAMME OFFICE IN PARTIAL FULFILLMENT
# OF THE REQUIREMENTS FOR THE DEGREE OF BACHELOR OF SCIENCE
# IN COMPUTER SCIENCE
Advisor:
# ZELALEM
# SEPTEMBER 2025

HiLCoE
School of Computer Science and Technology
Enterprise Fleet Management Platform
Prepared by:
# LEUL TEWODROS AGONAFER
# LEUL YARED ASSEFA
# KIDUS MESFIN MEKURIA
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
15% and operational costs by roughly 20% , while improving route coherence. The platform
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
Acknowledgement i
Executive Summary ii
# 1 Introduction 1
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
# 2 System and Software Requirements Specification (SRS) 12
## 2.1 Introduction / Overview . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
## 2.2 Current System (Existing Manual W orkflow) . . . . . . . . . . . . . . . . . . 12
## 2.3 Proposed System . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 15
### 2.3.1 System Context and Actors . . . . . . . . . . . . . . . . . . . . . . . . 15
### 2.3.2 System Modules . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 15
### 2.3.3 Functional Requirements . . . . . . . . . . . . . . . . . . . . . . . . . 17
### 2.3.4 Non-Functional Requirements . . . . . . . . . . . . . . . . . . . . . . 17
### 2.3.5 Assumptions and Dependencies . . . . . . . . . . . . . . . . . . . . . 18
### 2.3.6 Constraints . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 18
### 2.3.7 Acceptance Criteria / Success Metrics . . . . . . . . . . . . . . . . . . 18
## 2.4 System Models . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 18
iii

### 2.4.1 Use Case Diagrams . . . . . . . . . . . . . . . . . . . . . . . . . . . . 19
### 2.4.2 Component and Architecture Diagram . . . . . . . . . . . . . . . . . . 44
## 2.5 External Interface Requirements . . . . . . . . . . . . . . . . . . . . . . . . . 45
## 2.6 Requirements Traceability Matrix . . . . . . . . . . . . . . . . . . . . . . . . 46
## 2.7 User Interface (UI) Mockups . . . . . . . . . . . . . . . . . . . . . . . . . . . 47
# 3 Design Specification Document 52
## 3.1 System Design Document (SDD) . . . . . . . . . . . . . . . . . . . . . . . . . 52
### 3.1.1 Architectural Style (Layered & Microservice) . . . . . . . . . . . . . . 52
### 3.1.2 Subsystem Decomposition . . . . . . . . . . . . . . . . . . . . . . . . 57
### 3.1.3 Data Persistence and Schema Design . . . . . . . . . . . . . . . . . . 61
### 3.1.4 Deployment and Runtime View . . . . . . . . . . . . . . . . . . . . . 67
### 3.1.5 Key Decisions and Trade-offs . . . . . . . . . . . . . . . . . . . . . . 70
## 3.2 Object Design Document (ODD) . . . . . . . . . . . . . . . . . . . . . . . . . 72
### 3.2.1 Package and Module Decomposition . . . . . . . . . . . . . . . . . . . 72
### 3.2.2 Key Class and Interface Descriptions . . . . . . . . . . . . . . . . . . 72
### 3.2.3 Error Handling and Exception Strategy . . . . . . . . . . . . . . . . . 74
### 3.2.4 UML Diagrams . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 75
### 3.2.5 State Transition Rules . . . . . . . . . . . . . . . . . . . . . . . . . . 96
# 4 Implementation Report 98
## 4.1 Development Environment and T echnology Stack . . . . . . . . . . . . . . . . 98
## 4.2 Implementation of Key Modules and Algorithms . . . . . . . . . . . . . . . . 103
### 4.2.1 Core Backend Service Implementation (Node.js/Express) . . . . . . . . 103
### 4.2.2 Optimization Service Implementation (Python/FastAPI) . . . . . . . . 107
### 4.2.3 Frontend Application Implementation (React) . . . . . . . . . . . . . . 110
## 4.3 Code for Major Functionalities (Annotated Snippets) . . . . . . . . . . . . . . 113
## 4.4 T esting Specification and Reports . . . . . . . . . . . . . . . . . . . . . . . . . 119
### 4.4.1 Unit T esting . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
### 4.4.2 Integration T esting . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
### 4.4.3 End-to-End (E2E) T esting . . . . . . . . . . . . . . . . . . . . . . . . 119
### 4.4.4 T est Results Summary . . . . . . . . . . . . . . . . . . . . . . . . . . 119
References 120
A User Manual 123
B Data Collection Methods and T ools 124
Milestones 125
iv

# List of Figures
## 1.1 A high-level diagram showing the frontend client, API server, and data store,
with an optional external optimizer. . . . . . . . . . . . . . . . . . . . . . . . 7
## 1.2 A flowchart tracing the system end to end, from user input through optimization
to analytics output. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 8
## 2.1 Existing Manual W orkflow . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14
## 2.2 Routegna Use Case Model . . . . . . . . . . . . . . . . . . . . . . . . . . . . 19
## 2.3 Use Case Diagram for UC-001 . . . . . . . . . . . . . . . . . . . . . . . . . . 24
## 2.4 Use Case Diagram for UC-002 . . . . . . . . . . . . . . . . . . . . . . . . . . 26
## 2.5 Use Case Diagram for UC-003 . . . . . . . . . . . . . . . . . . . . . . . . . . 27
## 2.6 Use Case Diagram for UC-004 . . . . . . . . . . . . . . . . . . . . . . . . . . 29
## 2.7 Use Case Diagram for UC-005 . . . . . . . . . . . . . . . . . . . . . . . . . . 31
## 2.8 Use Case Diagram for UC-006 . . . . . . . . . . . . . . . . . . . . . . . . . . 33
## 2.9 Use Case Diagram for UC-007 . . . . . . . . . . . . . . . . . . . . . . . . . . 34
## 2.10 Use Case Diagram for UC-008 . . . . . . . . . . . . . . . . . . . . . . . . . . 35
## 2.11 Use Case Diagram for UC-009 . . . . . . . . . . . . . . . . . . . . . . . . . . 36
## 2.12 Use Case Diagram for UC-010 . . . . . . . . . . . . . . . . . . . . . . . . . . 37
## 2.13 Use Case Diagram for UC-011 . . . . . . . . . . . . . . . . . . . . . . . . . . 38
## 2.14 Use Case Diagram for UC-012 . . . . . . . . . . . . . . . . . . . . . . . . . . 39
## 2.15 Use Case Diagram for UC-013 . . . . . . . . . . . . . . . . . . . . . . . . . . 40
## 2.16 Use Case Diagram for UC-014 . . . . . . . . . . . . . . . . . . . . . . . . . . 41
## 2.17 Use Case Diagram for UC-015 . . . . . . . . . . . . . . . . . . . . . . . . . . 42
## 2.18 Use Case Diagram for UC-016 . . . . . . . . . . . . . . . . . . . . . . . . . . 43
## 2.19 High-Level Component and Architecture Diagram . . . . . . . . . . . . . . . . 44
## 2.20 UI Mockup: Login Page . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 47
## 2.21 UI Mockup: Administrator Dashboard . . . . . . . . . . . . . . . . . . . . . . 48
## 2.22 UI Mockup: Route Planning View . . . . . . . . . . . . . . . . . . . . . . . . 49
## 2.23 UI Mockup: Driver Portal . . . . . . . . . . . . . . . . . . . . . . . . . . . . 50
## 2.24 UI Mockup: Payroll Report Page . . . . . . . . . . . . . . . . . . . . . . . . . 51
## 3.1 High-Level Architectural View, illustrating the interaction between the client,
API, data layers, and external optimization services. . . . . . . . . . . . . . . . 54
## 3.2 Detailed Component Interaction Diagram, showing the flow of control and data
between controllers, middleware, services, and the persistence layer. . . . . . . 55
## 3.3 Multi-Fleet W orkflow Activity Diagram, detailing the end-to-end process from
a manager initiating route creation to final plan persistence. . . . . . . . . . . . 56
## 3.4 Subsystem Component View showing data ownership and key interactions. . . 60
## 3.5 Core Operational ERD - 1 . . . . . . . . . . . . . . . . . . . . . . . . . . . . 62
v

## 3.6 Optimization ERD - 2 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 63
## 3.7 Observability & Analytics ERD - 3 . . . . . . . . . . . . . . . . . . . . . . . . 64
## 3.8 Component Diagram: Application Services & Infrastructure Dependencies . . 76
## 3.9 Domain Class Diagram: Entities & Relationships . . . . . . . . . . . . . . . . 77
## 3.10 Layer Diagram: Service & Infrastructure Layers . . . . . . . . . . . . . . . . . 78
## 3.11 Package Diagram: Backend . . . . . . . . . . . . . . . . . . . . . . . . . . . . 79
## 3.12 Component Diagram: Frontend Component Hierarchy . . . . . . . . . . . . . 80
## 3.13 Data Flow Diagram: Frontend Architecture . . . . . . . . . . . . . . . . . . . 81
## 3.14 Activity Diagram: V ehicle A vailability Fallback Logic . . . . . . . . . . . . . 82
## 3.15 Sequence Diagram: Create Route with Clustering . . . . . . . . . . . . . . . . 83
## 3.16 Sequence Diagram: General Route Creation Flow . . . . . . . . . . . . . . . . 84
## 3.17 Sequence Diagram: Shift-Wide Optimization (Multi-Route Draft Generation) . 85
## 3.18 Sequence Diagram: Shift Preparation Clustering Flow . . . . . . . . . . . . . . 86
## 3.19 Sequence Diagram: Notification Delivery . . . . . . . . . . . . . . . . . . . . 87
## 3.20 Sequence Diagram: V ehicle-to-Route Assignment . . . . . . . . . . . . . . . . 88
## 3.21 Sequence Diagram: Editing an Existing Route . . . . . . . . . . . . . . . . . . 89
## 3.22 Sequence Diagram: Route Status Activation . . . . . . . . . . . . . . . . . . . 90
## 3.23 Sequence Diagram: Employee Assignment to Routes . . . . . . . . . . . . . . 91
## 3.24 Sequence Diagram: Employee Assignment Flow (UI/Backend Interaction) . . . 92
## 3.25 Sequence Diagram: Adding a New V ehicle . . . . . . . . . . . . . . . . . . . 93
## 3.26 Sequence Diagram: Payroll and Analytics Process . . . . . . . . . . . . . . . . 94
## 3.27 Sequence Diagram: T enant-Scoped Authentication & Data Fetch . . . . . . . . 95
## 3.28 State Machine diagram for the Route Lifecycle, illustrating the transitions be-
tween statuses like ACTIVE ,INACTIVE , andCANCELLED . . . . . . . . . . . . . 96
## 3.29 State Machine diagram for V ehicle Status, showing the operational states from
AVAILABLE andIN_USE to maintenance states like OUT_OF_SERVICE . . . . . . 97
vi

# List of Tables
## 1.1 Key Performance Indicators for Platform Adoption . . . . . . . . . . . . . . . 10
## 2.1 System Actors and Roles . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 15
## 2.2 System Modules and Responsibilities . . . . . . . . . . . . . . . . . . . . . . 16
## 2.3 Functional Requirements . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 17
## 2.4 Acceptance Criteria and Success Metrics . . . . . . . . . . . . . . . . . . . . . 18
## 2.5 External Interface Requirements . . . . . . . . . . . . . . . . . . . . . . . . . 45
## 2.6 Requirements Traceability Matrix . . . . . . . . . . . . . . . . . . . . . . . . 46
## 3.1 Subsystem Decomposition and Responsibilities . . . . . . . . . . . . . . . . . 57
## 3.2 Environment T opologies . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 67
## 3.3 Runtime Components and Scaling Characteristics . . . . . . . . . . . . . . . . 68
## 3.4 Resilience and Recovery Patterns . . . . . . . . . . . . . . . . . . . . . . . . . 69
## 3.5 Key Design Decisions and Trade-offs . . . . . . . . . . . . . . . . . . . . . . . 70
## 3.6 Deferred T opics and Revisit Triggers . . . . . . . . . . . . . . . . . . . . . . . 71
## 3.7 Package and Module Decomposition . . . . . . . . . . . . . . . . . . . . . . . 72
## 3.8 Key Backend Class and Module Interfaces . . . . . . . . . . . . . . . . . . . . 73
## 3.9 Key Frontend Component Contracts . . . . . . . . . . . . . . . . . . . . . . . 74
## 3.10 Domain Entity Snapshot . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 74
## 3.11 Error Handling and HTTP Status Codes . . . . . . . . . . . . . . . . . . . . . 74
vii

# Chapter 1 – Introduction
This report describes the design, development, and evaluation of an enterprise cloud-based fleet
management platform that supports adaptive routing, passenger pooling, and predictive fore-
casting. The system, called Routegna, was developed as part of the Senior Project course at
HiLCoE School of Computer Science and T echnology in 2025. The project was completed
by Leul T ewodros Agonafer, LEUL Y ARED ASSEFA, and Kidus Mesfin Mekuria, under the
guidance of Advisor Zelalem.
At its heart, Routegna is a Software-as-a-Service (SaaS) solution tailored for corporate shut-
tle operations. Unlike fragmented approaches—where organizations juggle spreadsheets, GPS
trackers, or manual call-based coordination—the platform pulls together scheduling, routing,
payroll, and driver communication in a single place. This integration is meant to reduce ineﬀi-
ciencies and administrative overhead, both of which are common pain points when companies
rely on improvised tools.
The rest of this introduction is organized as follows: first, the background of the problem is
outlined. Then, the problem statement and objectives are presented, followed by a discussion
of scope, methodology, and significance.
1.1. Background
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
1.2. Statement of the Problem
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
# C=∑
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
# MAE =1
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
1.3. Objectives
### 1.3.1 General Objective
The principal aim of this work is to design, implement, and validate a web-based, enterprise-
grade SaaS platform that automates and optimizes corporate shuttle operations. This covers the
full lifecycle from demand intake through dynamic routing and scheduling to payroll reconcil-
iation and operational analytics—delivered in a secure, organization-scoped form suitable for
enterprise environments [ 1], [ 7].
### 1.3.2 Specific Objectives
•Implement a T wo-Stage Route Optimization Process. The platform first uses a Python/-
FastAPI microservice to group pickup points into geographically sensible clusters. Subse-
quently, a client-side nearest-neighbor heuristic computes the optimal stop ordering within
each cluster, supported by Mapbox Directions for travel metrics. This staged approach is more
tractable than monolithic optimization and is designed to cut travel time and operational costs
[1], [ 8].
•Implement Demand Analytics & Reporting Dashboards and APIs expose peak demand
windows, route utilization, eﬀiciency indicators, and payroll-ready exports. Forecasting is
identified as future work but not yet implemented.
•Design a Secure Architecture for Enterprise Deployment The system is built on Express
+ Prisma with organization-scoped data access, role checks, and environment-driven config-
3

uration to ensure data sovereignty and secure enterprise use [ 7].
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
1.4. Scope and Limitation
The project had to be scoped carefully . On the one hand, we wanted to show a full end-to-end
shuttle management solution; on the other, we needed something we could realistically finish
within the academic schedule. What follows is what actually made it in, and what was left for
later.
### 1.4.1 Scope
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
4

a Python/FastAPI microservice that clusters stops based on location. The client then performs
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
### 1.4.2 Limitations
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
1.5. Methodology / Approach
The way Routegna was developed was not a straight, rigid process. It combined formal en-
gineering practices with a fair amount of iteration and adjustment along the way . We leaned
on domain-driven design (DDD) ideas within a layered architecture. Clear separation between
UI, API, and data layers—along with organization-scoped APIs—kept responsibilities separate,
5

ensured tenant isolation, and made it easier to evolve parts of the system without breaking the
whole thing [ 9].
### 1.5.1 Requirements Analysis & System Design
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
### 1.5.2 Implementation
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
### 1.5.3 Testing Strategy
T esting wasn’t left for the end; it was layered throughout development.
•Unit/integration tests: Vitest + supertest validate API endpoints and server-side business
6

logic.
•Client tests: Lightweight component tests are supported, while end-to-end UI flows are ver-
ified manually using mock data in the development environment.
•Authorization checks: A matrix of role and tenant permissions is exercised through tests to
ensure no unauthorized cross-access occurs.
This multi-level approach helps catch issues before they become systemic.
### 1.5.4 Deployment
Deployment uses environment-based configuration and standard Node.js tooling.
•Build: ‘pnpm‘ scripts build the client (Vite) and server (T ypeScript) packages.
•Runtime: The server starts as a standard Node.js process, and the client is served as static
assets.
•Configuration: Environment variables control the database connection, authentication provider,
and external API keys (e.g., Mapbox).
•Observability: The system relies on structured console logs for debugging and monitoring.
### 1.5.5 System Diagrams
T wo diagrams support the written methodology: a high-level diagram showing the client, API
layer, and data store (Figure 1.1 ), and a flowchart illustrating the end-to-end process (Figure
## 1.2 ).
#### Figure 1.1: A high‐level diagram showing the frontend client, API server, and data store, with
an optional external optimizer.
7

#### Figure 1.2: A flowchart tracing the system end to end, from user input through optimization
to analytics output.
8

1.6. Significance and Beneficiaries
### 1.6.1 Significance
The Routegna platform was built not only to solve immediate operational headaches but also
to provide a foundation for longer-term transformation. Its relevance can be seen across four
dimensions: operational, financial, technological, and environmental.
•Operational eﬀiciency. In most organizations, route planning and payroll reconciliation con-
sume many staff hours every week. Studies on similar automation report that such tasks can
be reduced by over 80% [ 6], freeing time for supervisors to focus on service quality instead
of repetitive paperwork.
•Financial savings. Research on shuttle optimization repeatedly shows reductions in operating
costs (about 23% daily), fuel usage (roughly one-third annually), and maintenance spend (over
35%). In some cases, fleet sizes can be trimmed by 21–27% without reducing coverage [ 1],
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
### 1.6.2 Beneficiaries
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
### 1.6.3 Key Performance Indicators (KPIs)
Adoption should be measured with specific, repeatable metrics:
#### Table 1.1: Key Performance Indicators for Platform Adoption
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
### 1.6.4 Adoption Considerations & Risks
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
### 1.6.5 Next Steps (Recommendations)
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
2.1. Introduction / Overview
This chapter lays out the System and Software Requirements Specification (SRS) for Routegna,
our platform aimed at streamlining corporate shuttle services. Building on the business case
from Chapter 1, it defines what the system needs to do—both in terms of core functions and
non-functional qualities like security, performance, and usability . Think of it as the blueprint
that guides everything from design to testing, making sure everyone has a shared view of what
success looks like.
The main goal is to spell out requirements clearly so stakeholders, from project supervisors
to the development team, can see exactly how Routegna addresses real-world issues such as
ineﬀicient routing, messy payroll, and lack of data visibility . It covers the scope of a web-
based, multi-tenant tool designed for corporate fleets in congested urban areas such as Addis
Ababa. References to key terms and assumptions are included, tying the specification back to
the project’s overall aims and ensuring everything stays practical and traceable.
The adoption of a layered, multi-tenant SaaS architecture with role-based access control (RBAC)
is not arbitrary; it reflects well-documented practices in secure and scalable fleet-management
platforms. Recent studies highlight that such architectures improve both cost eﬀiciency and
long-term maintainability in urban mobility contexts [ 13]–[ 15].
T o preserve tenant isolation, the system employs organization-scoped identifiers, an approach
consistent with mixed-integer programming models for dynamic fleet scheduling that also ac-
count for environmental constraints such as emission limits [ 14]. In addition, the requirement
for flexible, role-based dashboards is informed by adaptive transit research, which recommends
hybrid strategies that combine fixed-route and demand-responsive service design [ 15], [ 16].
Finally, the specification for supporting mixed diesel and electric fleets—including energy-
aware routing—draws on lessons from large-scale shuttle scheduling at major airports, where
centralized coordination has been shown to reduce both cost and environmental impact [ 17].
2.2. Current System (Existing Manual Workflow)
Up until Routegna, shuttle services were managed through a patchwork of manual steps that
consumed time and created errors. The process exposed several critical weaknesses:
•Scattered Data & Manual Intake: Employees sent ride requests through whatever was
handy—spreadsheets, emails, or even chat threads. This resulted in scattered data, duplicates,
and no single master list for planning.
12

•Ineﬀicient Route Planning: Coordinators pieced together pickup points using Google Maps,
relying more on guesswork than science. Planning a single shift could take one to two hours,
often resulting in overloaded vans while others ran half empty . No structured history was
captured for reuse or analysis.
•Static Communication: Drivers received assignments via static printouts or SMS, leaving
them with little visibility into last-minute changes. Traﬀic jams, breakdowns, or shift swaps
turned into a frenzy of phone calls that rarely reached everyone affected.
•Manual Payroll & Reconciliation Errors: The finance team reconciled hours, mileage, and
invoices by hand. Payroll cycles dragged, with mismatches of 8–12% between hours billed
and hours worked being typical.
In short, the manual process reflected the classic Employee Shuttle Routing Problem while also
exposing bigger gaps: no real audit trail, no demand forecasting, and no access control. These
weaknesses directly shaped the requirements for Routegna’s automated solution.
13

#### Figure 2.1: Existing Manual Workflow
14

2.3. Proposed System
The system we propose, Routegna, is meant to take over the existing manual process of handling
shuttle operations. Instead of spreadsheets and fragmented tools, it introduces a web-based
platform that is structured, modular, and role-specific. At the front it runs as a Single Page
Application (SP A) that adapts to different user roles, while in the back it exposes REST APIs.
The architecture enforces tenant isolation, uses role-based access, and ties everything together
through organization-scoped data handling.
Its main capabilities cover CRUD operations for vehicles, drivers, employees, and stops, route
planning with Mapbox integration, a prototype clustering service for rider assignments, payroll-
ready reporting, and in-app notifications. In addition, analytics dashboards are included for
ongoing monitoring and improvements. The design breaks the system into modules, each with
a clear boundary of responsibility, which helps both maintenance and extension in the future.
### 2.3.1 System Context and Actors
Several actors interact with the system, each with their own role, permissions, and responsibil-
ities.
#### Table 2.1: System Actors and Roles
Actor Details
Super AdministratorDescription: Global operator managing demo data and onboarding
tenants.
Key Needs: Provision tenants, seed catalogues, monitor health.
OwnerDescription: Organization founder with full administrative privileges
within their tenant.
Key Needs: Manage organization settings, oversee all operations, access
all features.
Organization
AdministratorDescription: Manages vehicles, employees, and policies of one or-
ganization.
Key Needs: Maintain data, authorize managers, check reports.
Shuttle ManagerDescription: Handles daily routes and assignments of drivers.
Key Needs: Cluster riders, optimize routes, track utilization.
DriverDescription: Executes the assigned routes.
Key Needs: Access route manifests, follow stop order, pick up on
time.
Finance/HR OﬀicerDescription: Manages payroll and reconciles records.
Key Needs: Generate exports, audit ride history, confirm payments.
Employee/RiderDescription: Requests shuttle services for commuting.
Key Needs: Submit requests, see pickup and timing details.
### 2.3.2 System Modules
The functions are divided into logical modules:
15

#### Table 2.2: System Modules and Responsibilities
Module Responsibilities
Authentication & Session•OAuth callbacks
•Enforce sessions
•T enant binding
Organization & T enant
Management•Store organizations
•Enforce data scoping with organizationId
Fleet & Resource Manage-
ment•CRUD for vehicles, employees, drivers, and stops
Route Planning & Visual-
ization•Create/edit routes
•Integrate with Mapbox
•Editing flows in UI
Clustering & Assignment•Use OR- T ools to group riders
•Suggest assignments
Payroll & Reporting•Aggregate trips
•Calculate compensation
•Produce finance-ready exports
Analytics & Insights•Show KPIs and dashboards for utilization, cost, exceptions
Notifications•Deliver in-app event notifications
•Prepare for push features
Audit & Compliance•Keep audit logs
•Support GDPR export/delete
•Help with compliance
Infrastructure Services•Handle logging, rate limiting, configuration
16

### 2.3.3 Functional Requirements
#### Table 2.3: Functional Requirements
ID Requirement
FR-01 The system shall allow authorized administrators to manage (create, read, update,
delete) vehicles, drivers, employees, and stops within their own organization.
FR-02 The system shall support the creation, editing, and publishing of shuttle routes with
correctly sequenced stops.
FR-03 The system shall provide a mechanism to optimize the stop sequence for a given
route by invoking the Mapbox Directions API.
FR-04 The system shall provide an automated clustering mechanism for suggesting rider-
to-vehicle assignments.
FR-05 The system shall allow authorized users to generate and export payroll-ready reports.
FR-06 The system shall enforce tenant isolation and Role-Based Access Control (RBAC)
in all API calls.
FR-07 The system shall log critical user and system actions (e.g., route creation, payroll
generation) to create an audit trail.
FR-08 The system shall provide in-app notifications to users for important, time-sensitive
events.
FR-09 The system shall display an analytics dashboard with key metrics such as vehicle
utilization, operational costs, and exceptions.
### 2.3.4 Non‐Functional Requirements
Performance
•NFR-P1: Queries for up to 50 stops should return in ≤400 ms (95th percentile).
•NFR-P2: Clustering results returned in ≤30 seconds for standard workload.
Scalability
•NFR-S1: Support 5–10 concurrent organizations without performance impact.
•NFR-S2: Services are designed to be container-friendly for scaling (stateless APIs, environment-
based configuration).
A vailability
•NFR-A1: Maintain 99.5% uptime on core APIs.
•NFR-A2: Provide fallbacks for third-party outages (e.g., Mapbox).
Security
•NFR-SEC1: Prevent cross-tenant leaks with strict filtering by organizationId.
•NFR-SEC2: Secure session management and protection of secrets.
•NFR-SEC3: Follow OW ASP guidelines to block common vulnerabilities.
17

Maintainability
•NFR-M1: Keep modular design with separation of concerns to avoid heavy coupling.
### 2.3.5 Assumptions and Dependencies
•Organizations supply correct employee location data and vehicle capacity .
•Mapbox Directions API must stay available.
•OAuth provider (Fayda / Better Auth) continues to handle sessions securely .
•PostgreSQL instance is accessible with low latency .
•Current rate limiting is in-memory; Redis will be required for scaling.
•Privacy compliance (GDPR and similar) applies to handling of personal data.
### 2.3.6 Constraints
•T echnical: In-memory rate limiting limits scalability until Redis or another store is used.
•Regulatory: Employee location data must be managed according to privacy laws.
•Financial: Third-party APIs (Mapbox) add cost risks.
•Schedule: Academic deadlines restricted time for advanced clustering features.
•Infrastructure: Deployment is currently single-region with limited resources.
### 2.3.7 Acceptance Criteria / Success Metrics
#### Table 2.4: Acceptance Criteria and Success Metrics
Metric Target Measurement
Route planning time re-
duction≥50% faster than
manualCompare coordinator time before/after de-
ployment.
V ehicle utilization +10–15% average
occupancyReview analytics dashboards and trip data.
Payroll reconciliation
savings≥6 staff-hours per
weekFinance review of export logs.
Unauthorized access 0 incidents Run automated security regression tests.
Notification acknowl-
edgment≥80% acknowl-
edged within 10
minutesCheck notification logs/telemetry .
2.4. System Models
In this part, the focus is on how Routegna behaves and how it is structured. The use case model
gives a clear picture of the different actors in the system and what each of them can do to reach
18

their goals. Alongside that, the diagrams provide extra support by showing scope and the overall
architecture in a more visual way . These models are not separate from the requirements; instead,
they connect back to both functional and non-functional needs, making sure the design and the
later implementation stay consistent with what was planned.
### 2.4.1 Use Case Diagrams
The main use case diagram for Routegna brings together all of the key actors and their inter-
actions. Administrators, shuttle managers, drivers, finance or HR oﬀicers, and employees are
each shown with the roles they play in the system. The diagram outlines how these actors use
different features, whether that is managing resources, planning and assigning routes, generat-
ing payroll reports, or just requesting rides. Each link in the diagram has a direct relation to the
earlier requirements, which makes it easy to trace back why a feature exists and who depends
on it.
#### Figure 2.2: Routegna Use Case Model
19

UC-001 Route Creation & Management
Goal Enable a Fleet Manager to construct or adjust a route with manual control while
being presented with optimization recommendations from the clustering service that can
be selectively adopted or overridden.
Scope Operational route planning within a tenant for shifts, special deployments, VIP
trips, or exception handling where managerial judgment may supersede algorithmic sug-
gestions.
Description When a Manager initiates route creation (or edits an existing route), the
system automatically fetches available shuttles and requests clustering optimization from
the FastAPI Optimization Service. The clustering results are presented as recommended
employee assignments for each available shuttle, showing which employees are suggested
for each vehicle based on capacity constraints and location proximity. The Manager may
select recommended employees for shuttles, make manual adjustments by adding/removing
employees, or override the recommendations entirely. All selections trigger real-time
capacity validation and shuttle availability checks. Finalizing the route persists the final
employee assignments, vehicle selection, and derived metrics, making the route available
for dispatch and analytics.
Actors
•Primary: Fleet Manager
•Supporting systems/components: Optimization Service (FastAPI), Vehicle Inventory
subsystem, Employee/Shift registry, Authentication provider (Better Auth / Fayda),
Mapbox Directions (route visualization), Notification/Dispatch (WebSocket hub),
Prisma/PostgreSQL persistence.
Preconditions
•Fleet Manager is authenticated via Better Auth (Fayda or federated provider).
•Tenant context (organization) is resolved and Manager has route-creation permissions.
•Vehicles and employees for the target shift exist and are marked AVAILABLE.
•Optimization Service endpoint configured (if unreachable, the Manager proceeds with
manual flow; clustering recommendations are unavailable).
Trigger Manager selects Create New Route or Edit Route in the Route Management
interface.
20

UC-001 Route Creation & Management (Scenario)
Main Success Scenario
1. Manager opens the Create Route wizard and selects a shift and location.
2. System fetches available shuttles for the selected shift and loads unassigned employees.
3. System automatically requests clustering optimization from the FastAPI service using employee locations and shuttle capacities.
4. System presents available shuttles with recommended employee assignments for each shuttle based on clustering results.
5. Manager selects a shuttle to view its recommended employees and current capacity utilization.
6. Manager chooses one option:
•Accept clustering recommendations by selecting "Select Recommended" for a shuttle, or
•Make adjustments by manually adding/removing employees from shuttles, or
•Override recommendations entirely by building the route manually.
7. As Manager makes selections, the system validates shuttle capacity constraints and prevents over-assignment.
8. Manager finalizes the route with explicit Preview & Create action.
9. System calculates route metrics using Mapbox Directions API and persists the final employee assignments, vehicle selection, and derived metrics.
10. System transitions route state to ACTIVE and makes it available for dispatch, live tracking, and analytics.
21

UC-001 Route Creation & Management (Extensions)
Extensions / Alternate Flows
•A1 — Optimization Service Timeout: system logs the timeout and displays “No rec-
ommendation available (timeout)”; Manager proceeds manually and may retry the rec-
ommendation request.
•A2 — Mapbox Metrics Unavailable: system substitutes heuristic metrics (straight-
line estimates or cached segment times) and clearly labels metrics as degraded.
•A3 — Capacity Breach Attempt: when an additive action causes capacity overflow,
the system blocks the change and prompts for adjustment (select larger vehicle or re-
move assigned employees).
•A4 — V ehicle Swap After Edits: Manager changes vehicle; system revalidates capac-
ity and recalculates utilization and travel metrics before allowing finalization.
•A5 — Partial Adoption / Locking: Manager may lock specific clusters/groups and
request refined recommendations for the unlocked remainder; system records partial
adoption percentages.
•A6 — Post-Persistence Modification: Manager edits an ACTIVE but not yet DIS-
P ATCHED route; system logs the modification and updates the route accordingly.
Business Rules
•B1: Clustering recommendations are presented as shuttle-specific employee assignments and do not auto-apply.
•B2: Capacity validation is real-time and blocking — the system must prevent saving a route that violates vehicle capacity constraints.
•B3: Routes are created with employee assignments as provided by the clustering service or manual selection.
22

UC-001 Route Creation & Management (NFRs & Data)
Non-Functional Considerations
•Responsiveness: initial optimization recommendation SLA target ≤5 s (p95).
•Observability: each optimization request is tagged with a correlation id for tracing and
trend analysis.
•Security: all mutations are tenant-scoped; no cross-tenant references are permitted.
•Reliability: manual construction path must remain fully functional if external services
degrade.
Data Captured (Persisted)
•Route header: id, name, tenantId, shiftId, vehicleId, status.
•Stops: ordered index, employeeId (optional), lat/lon, arrival metadata.
•Metrics: totalDistance, totalDuration, utilizationRatio.
Audit & Traceability No audit logging of recommendation hashes or deviation tracking is implemented.
23

Validation Criteria
- **Clustering Recommendations**: System must present clustering results as shuttle-specific employee assignments (not auto-applied plans) and validate against vehicle capacity constraints in real-time, matching the FastAPI service implementation in `clustering/src/main.py` and the client-side validation in `CreateRouteForm.jsx`.
- **Manual Control**: Manager must be able to override recommendations entirely or make adjustments, with all changes triggering capacity checks, as implemented in `packages/server/src/routes/routes.ts`.
- **Data Persistence**: Final route must persist employee assignments, vehicle selection, and Mapbox-derived metrics, ensuring no cross-tenant leaks via organization-scoped queries in Prisma.
- **Error Handling**: System must handle clustering service timeouts gracefully (fallback to manual flow) and prevent capacity breaches, as validated in integration tests.
- **Security & Performance**: All operations must enforce RBAC and complete within ≤5s (p95) for recommendations, with tenant isolation verified through automated tests.
23
24

UC-002 Driver's Daily Workflow & Live Updates
Goal To provide drivers with a read-only interface for viewing their assigned routes.
Description This use case defines the daily workflow of a driver. Through the Driver Portal, they receive instructions and can view their assigned route details, including map and stop order, for reference during their shift.
Actors
•Primary: Driver
•Secondary: Fleet Manager
Preconditions A dispatched route exists for the driver's shift.
Main Success Scenario
1. Driver logs into the Driver Portal.
2. System displays assigned route with map and stop order.
3. Driver reviews route information for navigation and planning.
Validation Criteria
- System must verify that the route is successfully published and visible to the assigned driver.
- Route data must be synchronized across all connected devices within 30 seconds of publication.
Extensions If the Fleet Manager modifies a route mid-shift, the system pushes an update to the Driver's device, refreshing the route view instantly.
25

#### Figure 2.4: Use Case Diagram for UC‐002
26

UC-003 Administrator Manages P ayroll
Goal T o generate payroll reports based on aggregated driver and trip logs for a defined
pay period.
Description This use case allows administrators to securely prepare payroll-ready re-
ports from historical data. The reports may be reviewed on-screen or exported for use by
the finance department.
Actors
•Primary: Administrator
Preconditions User authenticated as Administrator with financial rights.
Main Success Scenario
1. Administrator accesses the Payroll module.
2. Chooses pay period and parameters.
3. System aggregates relevant trip and driver records.
4. Aggregated data is displayed as a structured report.
Validation Criteria
- System must verify that payroll data is accurately aggregated from completed routes and driver logs.
- Reports must include proper date range filtering and organization-specific data isolation.
- Exported CSV/PDF files must contain all required payroll fields and be properly formatted.
- Report generation must complete within acceptable time limits for large datasets.
Extensions Administrator can export the report into CSV or PDF format.
#### Figure 2.5: Use Case Diagram for UC‐003
27

UC-004 System User Role Hierarchy
Goal T o define the hierarchical Role-Based Access Control (RBAC) model that governs
security and access.
Description This conceptual use case explains how roles are structured and how permis-
sions cascade. Each higher role inherits from the base while adding its own capabilities,
ensuring least-privilege access and proper segregation of duties.
Actors
•System (RBAC engine)
•All defined user roles
Preconditions Active session established.
Role Breakdown
•Base User: Can log in and view profile.
•Driver: Inherits Base User rights, plus can execute assigned routes.
•Fleet Manager: Inherits Base User rights, plus manages routes and fleet resources.
•Administrator: Inherits Fleet Manager rights, plus manages all user accounts and
system settings.
Validation Criteria
- System must verify that role hierarchy is properly structured with correct inheritance patterns.
- All user roles must be assigned appropriate permissions based on their hierarchical level.
- Role inheritance must cascade permissions correctly from base user through each level.
- Permission checks must enforce least-privilege access and proper segregation of duties.
- Role assignments must be validated against organizational policies and security requirements.
- System must prevent unauthorized role escalation or privilege accumulation.
Extensions
•Role customization: Administrators can define additional roles beyond the standard hierarchy.
•Permission auditing: System logs all role-based access attempts for compliance purposes.
28

#### Figure 2.6: Use Case Diagram for UC‐004
29

UC-005 Asset & Resource Management
Goal T o provide basic yet complete CRUD (Create, Read, Update, Delete) functions for
the system’s key resources — vehicles, drivers, employees, and physical locations.
Description Accurate fleet management starts with clean data. In this use case, the Fleet
Manager keeps the database updated by adding new assets, correcting records, or remov-
ing outdated ones. The point here is to make sure the resources stored in the system
always match the actual state in the field.
Actors
•Primary: Fleet Manager
Preconditions The Fleet Manager must already be logged in.
Main Success Scenario (Add a New V ehicle)
1. The Fleet Manager goes to Manage V ehicles.
2. Chooses the Add New V ehicle option.
3. The system shows a form asking for vehicle details and its category .
4. Manager fills the form and submits.
5. The system saves the new entry in the assets database.
Extensions
•Assign Driver to V ehicle: At any time, the Manager can link an existing driver to an
existing vehicle.
•Update or Delete Assets: Old or wrong records can be edited or removed.

#### Validation Criteria
For UC-005 to be considered successfully executed, the following must be validated:
- **Data Integrity**: All vehicle records must contain required fields (make, model, capacity, license plate, category) and pass format validation (e.g., valid license plate format, positive capacity values).
- **Uniqueness Constraints**: Vehicle license plates must be unique within the organization to prevent duplicate registrations.
- **Category Association**: Vehicles must be assigned to valid vehicle categories that exist in the system.
- **Authorization**: Only Fleet Managers with appropriate permissions can create, update, or delete vehicle records.
- **Audit Trail**: All CRUD operations on vehicles must be logged with timestamps, user IDs, and operation details for compliance and troubleshooting.
- **Data Consistency**: Updates to vehicle records must not break existing route assignments or driver associations without proper cascading or validation warnings.
- **Performance**: CRUD operations should complete within acceptable time limits (under 2 seconds for individual operations, under 10 seconds for bulk operations).

30

#### Figure 2.7: Use Case Diagram for UC‐005
31

UC-006 Operational Reporting Dashboard
Goal To provide Fleet Managers with basic operational statistics on the main dashboard.
Description The dashboard displays high-level summary statistics including active routes, total passengers served, and total stops managed. This provides Fleet Managers with a quick overview of current fleet status and route assignments.
Actors
•Primary: Fleet Manager
Preconditions Manager is authenticated and authorized for dashboard access.
Main Success Scenario
1. The Manager accesses the operational dashboard.
2. The system displays basic statistics (active routes, total passengers, total stops).
3. Manager reviews the dashboard statistics and route information.
Extensions
•Route filtering and search functionality.
•Interactive map display of selected routes.
•Route details panel with assignment information.
Validation Criteria
•Dashboard displays accurate basic statistics including active routes, total passengers served, and total stops.
•Statistics are calculated from actual operational data in the database.
•Dashboard loads and displays data within acceptable performance limits.
•All displayed metrics are validated against actual operational data from the database to ensure accuracy.

#### Figure 2.8: Use Case Diagram for UC‐006
33

UC-007 Authentication & Session Establishment
Goal T o log users in via Fayda OAuth/Better Auth and start a session with the right
organizational context.
Description This use case describes the login flow . Users are sent to the provider for
authentication, then the system establishes a secure session when they come back.
Actors
•Primary: User
•Secondary: Authentication Provider
Preconditions User must have valid credentials.
Main Success Scenario
1. User clicks login.
2. System redirects to the Auth Provider.
3. Provider validates and calls back.
4. Better Auth finalizes the session, sets cookies.
5. User is redirected into the client app.
Extensions
•Refresh session.
•Logout when needed.

#### Validation Criteria
For UC-007 to be considered successfully executed, the following must be validated:
- **Authentication Flow**: OAuth provider successfully validates user credentials and returns authorization code to the application.
- **Session Creation**: Better Auth creates a secure session with proper JWT tokens and HTTP-only cookies containing session identifiers.
- **Organization Context**: Session is properly bound to the user's active organization with correct tenant scoping applied.
- **Security Headers**: All authentication responses include appropriate security headers (CSP, HSTS, secure cookies) and no sensitive information is leaked.
- **Error Handling**: Invalid credentials, expired tokens, or provider failures result in appropriate error messages without exposing internal system details.
- **Session Persistence**: Session remains valid across page refreshes and maintains user context until explicit logout or timeout.
- **Audit Logging**: All authentication attempts, successes, and failures are logged with timestamps, IP addresses, and user identifiers for security monitoring.

#### Figure 2.9: Use Case Diagram for UC‐007
34

UC-008 T enant Context Management
Goal T o keep the right organization scope active during a session.
Description For multi-tenant use, each session must be bound to one organization. This
ensures requests and data always stay inside the correct tenant.
Actors
•Primary: Administrator / Manager
Preconditions Session already exists.
Main Success Scenario
1. User selects the active organization.
2. The system updates session context.
3. All API calls are scoped to that organization.
Extensions A UI organization switcher lets users change scope without logging out.
Validation
•Session binding: Verify that the selected organization is correctly stored in the session context and persists across requests.
•API scoping: Confirm that all subsequent API calls include the organizationId parameter and return only data belonging to the active organization.
•Data isolation: Ensure that users cannot access data from organizations they don't belong to, even when switching contexts.
•UI feedback: Validate that the organization switcher displays available organizations and provides clear feedback when switching.
•Security: Confirm that organization switching requires proper authentication and authorization checks.
#### Figure 2.10: Use Case Diagram for UC‐008
35

UC-009 Employee Onboarding & Stop Association
Goal T o create employee records and link them to geographic stops.
Description Each employee must have a profile, and for routing to work, that employee
must be tied to a stop with coordinates. This use case covers both steps: creating the
record and linking the stop.
Actors
•Primary: Fleet Manager / Administrator
Preconditions
•Organization is set up.
•User is logged in.
Main Success Scenario
1. Manager creates a new employee record.
2. Either creates a new stop or selects an existing one.
3. Stop is assigned to the employee.
4. Employee is now ready for routing.
Extensions
•Bulk employee import.
•Update stop location if needed.
Validation
•Verify employee record creation with required fields (name, contact info, employment details).
•Validate stop coordinates are within service area boundaries.
•Confirm unique employee identification and prevent duplicate records.
•Ensure stop assignment creates proper employee-stop relationship in database.
•Validate that assigned stop is not already occupied by another employee.
•Confirm successful database transaction for employee and stop records.
#### Figure 2.11: Use Case Diagram for UC‐009
36

UC-010 V ehicle Availability Scheduling
Goal T o mark vehicles available or unavailable for shifts.
Description Managers need to plan ahead which vehicles can be used. This use case
allows them to pick dates and shifts and set availability, which helps later during assign-
ment.
Actors
•Primary: Fleet Manager
Preconditions
•V ehicles exist in the database.
•Shifts are configured.
Main Success Scenario
1. Manager chooses a vehicle.
2. Picks the shift and date.
3. Marks it as available.
4. System saves the status.
Extensions
•Bulk update for multiple vehicles.
•Option to note a reason for unavailability .
#### Figure 2.12: Use Case Diagram for UC‐010
37

UC-011 Single-Stage Route Optimization
Goal T o generate route metrics (distance and time) for an ordered list of coordinates.
Description The use case takes a sequence of stops and produces an optimized path
along with travel metrics, using Mapbox Directions as the external service.
Actors
•Primary: Fleet Manager (through the system’s UI)
•Secondary: Mapbox API
Preconditions A valid route with a coordinate list is already assembled.
Main Success Scenario
1. User saves or edits an existing route.
2. The frontend invokes the optimizeRoute function.
3. Mapbox Directions API returns route geometry and travel metrics.
4. The system renders the metrics and route details in the UI.
Extensions
•Adjusted duration heuristics may be applied when necessary .
•If required, a heuristic fallback is triggered.
### Validation Criteria for UC-011
For UC-011 to be considered successfully executed, the following must be validated:
- **Route Optimization Function**: The optimizeRoute function correctly processes coordinate sequences and returns valid distance/time metrics for ordered stop lists.
- **Mapbox API Integration**: Mapbox Directions API successfully retrieves route geometry and travel metrics when available and properly handles API responses.
- **Data Parsing**: System correctly parses route data from external API responses into usable format for frontend consumption.
- **Frontend Display**: Route metrics (distance, duration) and route visualization are accurately displayed in the user interface with proper formatting.
- **Route Details Rendering**: Route details are rendered in the UI with clear visual representation of the optimized path and associated metrics.
- **Performance Requirements**: Route optimization completes within acceptable time limits (under 5 seconds for typical routes) without blocking user interactions.
- **Heuristic Fallback**: Fallback mechanism activates when Mapbox API is unavailable or fails, providing reasonable distance/time approximations.
- **Error Handling**: System gracefully handles invalid coordinate data, malformed route sequences, and API failures with appropriate user feedback.
- **Integration Workflow**: Route editing workflow properly integrates with optimization functionality, triggering appropriate optimization calls when routes are modified.
- **Data Flow**: Route data flows correctly between frontend optimization calls and backend services, maintaining data consistency throughout the process.
- **User Experience**: Users can successfully optimize routes and view accurate travel metrics without experiencing performance bottlenecks or data inconsistencies.

### Validation Criteria for UC-010
For UC-010 to be considered successfully implemented, the following validation criteria must be met:

**Functional Validation:**
- Vehicle availability records can be created, read, updated, and deleted through the API
- System enforces unique constraints preventing duplicate vehicle availability for the same vehicle, shift, and date combination
- Vehicle availability is properly scoped to organization boundaries with no cross-tenant data access
- Driver assignments are validated and automatically assigned when vehicles are scheduled
- Shift and date validations ensure availability schedules align with operational constraints

**Data Integrity Validation:**
- Vehicle availability records maintain referential integrity with related entities (vehicles, shifts, drivers)
- Organization ownership is enforced on all vehicle availability operations
- Database constraints prevent invalid state combinations and orphaned records
- Audit trails capture all availability schedule modifications for compliance

**Business Logic Validation:**
- Vehicle status checks prevent scheduling unavailable or maintenance vehicles
- Driver availability conflicts are detected and resolved during scheduling
- Time window validations ensure availability schedules don't exceed operational limits
- Capacity constraints are respected when scheduling vehicles for shifts

**Integration Validation:**
- Vehicle availability schedules properly integrate with route assignment workflows
- Availability status updates trigger appropriate notifications and UI refreshes
- Route creation validates vehicle availability before assignment
- Calendar interfaces accurately display availability status and conflicts

**Acceptance Criteria:**
- Fleet managers can successfully manage vehicle availability schedules through the interface
- System prevents double-booking of vehicles and drivers through validation
- Availability schedules are accurately reflected in route planning and assignment
- All availability operations complete within acceptable performance limits (< 2 seconds)
38

UC-012 Clustering Invocation
Goal T o cluster unassigned employees into groups matched with available vehicles.
Description The system groups employees based on their proximity and the capacity of
available vehicles, aiming for eﬀicient route allocation.
Actors
•Primary: Fleet Manager
•Secondary: Clustering Service
Preconditions Employee stops and vehicle availability are already recorded in the sys-
tem.
Main Success Scenario
1. A POST request is made to the clustering endpoint with the relevant payload.
2. The service returns proposed clusters.
3. The UI displays these candidate groupings for review .
Extensions Clusters may be persisted and transformed into formal route assignments.
### Validation Criteria for UC-012
For UC-012 to be considered successfully implemented, the following validation criteria must be met:

- **Endpoint Functionality**: POST /clustering endpoint correctly processes employee locations and vehicle capacities, returning structured cluster assignments.
- **Algorithm Accuracy**: Clustering service successfully groups unassigned employees by proximity and matches them to available vehicle capacities using OR-Tools optimization.
- **Data Integrity**: System maintains consistent employee and vehicle data throughout clustering operations with proper organization scoping.
- **User Integration**: Fleet managers can effectively review, modify, and approve clustering results for formal route creation.
- **Performance**: Clustering completes within 30 seconds for typical scenarios without blocking user interactions.

#### Figure 2.14: Use Case Diagram for UC‐012
39

UC-013 Notifications Creation & Retrieval
Goal To provide a real-time notification system for system users with WebSocket-based delivery and comprehensive event processing.
Description The system generates notifications in response to critical events such as route assignments, vehicle status changes, and system alerts. Users receive immediate notifications via WebSocket connections with automatic fallback to polling when connections fail. The system supports organization-scoped notifications with role-based filtering and maintains notification history for audit and user reference.
Actors
•Primary: System (Event Processing Engine)
•Secondary: User (Notification Consumer)
Preconditions The user is authenticated and has an active organization context.
Main Success Scenario
1. A system event triggers notification creation (route assignment, vehicle maintenance, etc.).
2. The notification is processed with proper user targeting and organization scoping.
3. Real-time delivery occurs via WebSocket connection to subscribed users.
4. Users can retrieve notification history and mark items as read.
5. Notifications are automatically cleaned up based on retention policies.
Extensions
•WebSocket connections automatically reconnect on network interruptions.
•Push notifications may be sent via external services (SMS/Email) for critical alerts.
•Notification preferences allow users to customize delivery methods and categories.

### Validation Criteria for UC-013
For UC-013 to be considered successfully implemented, the following validation criteria must be met:

- **Event Processing**: System correctly identifies and processes events requiring notifications, creating appropriate content with proper user targeting and organization scoping.
- **Real-time Delivery**: WebSocket connections enable immediate notification delivery with automatic reconnection and fallback to polling when connections fail.
- **Data Management**: Authenticated users can retrieve, filter, and mark notifications as read with proper authorization and data privacy controls.
- **Infrastructure**: Complete WebSocket server and client implementation with role-based notification subscriptions and connection management.
- **Lifecycle Management**: Notifications are automatically cleaned up based on retention policies while maintaining audit trails.
- **Performance**: Notification operations complete within 500ms for typical loads with scalable WebSocket fan-out for concurrent users.

*Note: Current implementation provides complete notification infrastructure (database schema, WebSocket connections, client state management) with stubbed business logic requiring service layer completion for full functionality.*

#### Figure 2.15: Use Case Diagram for UC‐013
40

UC-014 Mapbox F ailure F allback Handling
Goal T o maintain routing functionality when Mapbox Directions fails.
Description This use case ensures system resilience by using heuristics or cached data
when the Mapbox API is unavailable.
Actors
•Primary: Fleet Manager
•Secondary: System
Preconditions A network or Mapbox API failure is detected.
Main Success Scenario
1. The system detects a failed call to Mapbox Directions.
2. It triggers a nearest-neighbour heuristic.
3. An approximate path is computed and rendered, with a degraded state clearly indi-
cated.
Extensions
•Retry attempts may follow exponential backoff.
•Cached last-known routes may be provided if available.

### Validation Criteria for UC-014
For UC-014 to be considered successfully implemented, the following validation criteria must be met:

- **Failure Detection**: System automatically detects Mapbox API failures and activates nearest-neighbor heuristic fallback.
- **Route Continuity**: Fallback routes include all stops with approximate distance/time calculations, maintaining basic assignability.
- **User Experience**: UI clearly indicates degraded mode with appropriate warnings while preserving core routing functionality.
- **Recovery**: System seamlessly switches back to full Mapbox functionality when service is restored.
- **Performance**: Fallback operations complete within 5 seconds with acceptable degradation in route accuracy.

#### Figure 2.16: Use Case Diagram for UC‐014
41

UC-015 Documentation & Knowledge Synchronization
Goal Keep documentation, rules, and tasks aligned with code updates.
Description Ensures that architecture documents, SDDs, and use cases reflect ongoing
development changes.
Actors Engineering T eam
Preconditions A code change or planning update occurs.
Main Scenario
1. Developer implements a change.
2. Documentation and artifacts are updated accordingly .
3. Updated documentation is reviewed and verified.
Extensions Automated checks for documentation freshness.
### Validation Criteria for UC-015
For UC-015 to be considered successfully implemented, the following validation criteria must be met:

- **Change Tracking**: System identifies code changes requiring documentation updates and ensures affected artifacts are modified accordingly.
- **Artifact Consistency**: Documentation remains synchronized with code implementation, database schema, and API contracts.
- **Review Process**: Documentation updates undergo peer review and are committed only after verification of accuracy and completeness.
- **Automation**: CI/CD pipeline includes automated checks for documentation freshness and completeness.
- **Knowledge Preservation**: Critical design decisions and implementation details are properly documented for team accessibility.

#### Figure 2.17: Use Case Diagram for UC‐015
42

UC-016 Audit & Compliance Logging
Goal T o provide immutable event logging for compliance and investigations.
Description The system records critical access and modification events, ensuring trace-
ability for audits and security reviews.
Actors
•Primary: Administrator
•Secondary: Security Auditor
Preconditions The audit subsystem is enabled.
Main Success Scenario
1. A user performs an action.
2. The event is logged with the actor, timestamp, and context.
3. The auditor retrieves, filters, or exports logs.
Extensions
•T amper-evident hash chaining may be applied.
•Logs can be exported to an external SIEM.

### Validation Criteria for UC-016
For UC-016 to be considered successfully implemented, the following validation criteria must be met:

- **Event Completeness**: All system actions are captured with comprehensive context including actor identity, timestamps, action types, and affected entities.
- **Data Immutability**: Logged events cannot be modified or deleted, ensuring audit trail integrity for compliance and investigations.
- **Retrieval Functionality**: Auditors can search, filter, and export logs by date ranges, actor identities, action types, and entity identifiers.
- **Security Controls**: Audit log access is restricted to authorized personnel with all access attempts logged.
- **Performance Impact**: Logging operations add minimal latency to user actions while maintaining data consistency and accuracy.
- **Compliance Standards**: Logs are retained according to regulatory requirements with tamper detection mechanisms and export capabilities.

#### Figure 2.18: Use Case Diagram for UC‐016
43

### 2.4.2 Component and Architecture Diagram
The component diagram highlights the main system parts and their connections. The client is a
React SP A (Vite) that communicates with a Node.js/Express API. Data is stored in PostgreSQL
via Prisma, with organizationId enforcing tenant isolation. An optional FastAPI service pro-
vides clustering and route optimization experiments. External integrations cover routing (Map-
box Directions) and authentication, which supports multiple methods (OAuth, email/password,
etc.) with flexibility to add new providers later. Solid arrows show the main REST/data flows,
while dashed lines mark optional or future paths.
#### Figure 2.19: High‐Level Component and Architecture Diagram
44

2.5. External Interface Requirements
#### Table 2.5: External Interface Requirements
Interface Details
Mapbox Directions API•Purpose: Provides travel geometry, times, and distances.
•Protocol: HTTPS REST (GET /direction-
s/v5/mapbox/driving/{coords} with params like ge-
ometries, overview, steps).
•Notes: Requires VITE_MAPBOX_ACCESS_TOKEN;
subject to rate limits.
FastAPI Clustering Service•Purpose: Groups employees into vehicle clusters.
•Protocol: HTTP REST (proxied via Express).
•Notes: Prototype feature; POST /clustering with JSON
payload; runs locally .
Fayda OAuth (Authentication)•Purpose: Handles login and session issuance.
•Protocol: HTTPS OAuth2 (/api/au-
th/oauth2/callback/fayda).
•Notes: Default provider; extensible for Google, etc.
Internal REST API•Purpose: Main interface between client and backend.
•Protocol: HTTPS REST .
•Notes: T enant-scoped (organizationId), RBAC enforced,
handles CRUD for all business modules.
45

2.6. Requirements Traceability Matrix
#### Table 2.6: Requirements Traceability Matrix
Requirement ID & Summary Details
FR-01 – CRUD for fleet assets•Modules: V ehicles, Employees, Stops
•Status: Complete
FR-02 – Route creation & publishing•Modules: Routes, Mapbox integration
•Status: Complete
FR-03 – Stop ordering optimization•Modules: Route planner, Mapbox
•Status: Complete
FR-04 – Clustering automation•Modules: FastAPI clustering, Express proxy
•Status: Complete
FR-05 – Payroll export•Modules: Payroll subsystem
•Status: Complete
FR-06 – T enant isolation & RBAC•Modules: Auth middleware, Prisma filters
•Status: Complete
FR-07 – Audit logging•Modules: Logging subsystem
•Status: Partial
FR-08 – Notifications•Modules: Notifications service
•Status: Complete
FR-09 – Analytics dashboard•Modules: Dashboard component with basic statistics
•Status: Partial
46

2.7. User Interface (UI) Mockups
This section documents the key user interfaces of the Routegna platform. The designs served as
the blueprint for development and were fully realized in the final React-based implementation.
Each interface emphasizes clarity, role-awareness, and task-centered usability, with responsive
layouts that adapt across desktop and mobile devices.
The following subsections outline the primary views, accompanied by placeholders for Mock-
ups.
Login Page
A professional login screen featuring the company logo, a welcoming message, clean input
fields for email and password, and a prominent Sign In button. An OAuth option for Fayda
authentication is also available, alongside a tenant selection dropdown for multi-organization
support.
#### Figure 2.20: UI Mockup: Login Page
47

Administrator Dashboard
A modern admin panel layout with a sidebar for navigation.
#### Figure 2.21: UI Mockup: Administrator Dashboard
48

Route Planning View
A data-focused management page that lists existing routes in a structured table. Columns include
Route Name, Status, Driver, V ehicle, and Employee Count, with an Actions column for editing
or deleting entries. Above the table, a search and filter bar is available, along with a clearly
visible + Create New Route button.
#### Figure 2.22: UI Mockup: Route Planning View
49

Driver Portal
A simplified, mobile-optimized view designed for drivers.
#### Figure 2.23: UI Mockup: Driver Portal
50

Payroll Report Page
A reporting interface where administrators can select a date range and view aggregated trip and
driver data. The main table summarizes totals by period, and users can export results through
CSV or PDF options.
#### Figure 2.24: UI Mockup: Payroll Report Page
51

# Chapter 3 – Design Specification Document
This chapter outlines the Design Specification Document for Routegna. It follows directly from
the requirements defined in Chapter 2 and turns them into concrete design choices that guided
development. The document is divided into two major parts: the System Design Document
(SDD), which discusses overall architecture and deployment, and the Object Design Document
(ODD), which covers module structure, classes and interfaces, error-handling approaches, and
supporting UML diagrams.
A two-step strategy was adopted for route optimization. Passenger requests are first grouped by
location, and the resulting clusters are then sequenced with a nearest-neighbor ordering method.
Prior studies in mobility planning note that this combination reduces both travel time and oper-
ating costs compared with one-stage heuristics [ 13], [ 18].
T o keep the system flexible, the clustering component was built as its own FastAPI microservice.
This separation makes it easier to update the optimization logic independently of the rest of
the platform, a practice widely used in scalable fleet-management systems [ 18], [ 19]. Since
outside routing services cannot always be assumed to be available, a simplified local heuristic is
included as a fallback. Transport resilience research suggests this type of safeguard is essential
for maintaining service during short-term API failures [ 19], [ 20].
Pooling features were added to balance demand and improve rider experience. These include
stop-pooling and variable walking distances, which have been shown to reduce volatility in travel
times while improving service consistency [ 15], [ 21]. Reinforcement learning is applied for
flexible route control, and mixed-integer programming supports fleet sizing decisions. T ogether
these methods help the system reach demanding targets, including sub-second response times
(roughly 400 ms) and availability above 99.5
3.1. System Design Document (SDD)
The SDD ties the system back to the requirements in the SRS and records the architectural
reasoning that shaped the build. It covers the production architecture, subsystem decomposition,
data strategy, deployment topology, and the major design trade-offs made during development.
### 3.1.1 Architectural Style (Layered & Microservice)
Routegna uses a hybrid model: a layered monolith handles the majority of business logic, while
a separate FastAPI service performs clustering and assignment. This division keeps the main
API straightforward to maintain, yet allows the optimization tasks to be scaled or tuned without
affecting the rest of the platform.
•Client Layer — A React single-page application (SP A) delivering role-aware views (admin-
52

istrator, fleet manager, driver, employee). Layouts adapt responsively to desktop and mobile
contexts. The client also includes a lightweight ‘routeOptimization‘ module to ensure re-
sponsiveness when editing routes. This module applies a nearest-neighbor TSP heuristic for
provisional stop ordering, retries Mapbox Directions with progressively delayed intervals if
a call fails, and gracefully falls back to a sequential HQ→Stops→HQ path with estimated
metrics if Mapbox is unavailable.
•API Layer — Node.js / Express implements REST endpoints, orchestrates domain services,
and enforces BetterAuth Organization middleware for authentication, RBAC, and tenant scop-
ing. This layer proxies requests to external services (e.g., clustering, routing).
•Data Access Layer — Prisma ORM manages all interactions with the persistence layer, en-
suring type safety and schema consistency .
•Persistence Layer — PostgreSQL serves as the primary datastore. T enant isolation is en-
forced through an ‘organizationId‘ filter across domain models, with additional protections
applied in middleware.
•Optimization Services — The platform employs a two-tier approach to route optimization:
–Clustering Microservice (FastAPI): Handles multi-vehicle clustering and assignment. It
groups employees or stops into vehicle buckets and produces an initial stop-order heuristic
for each vehicle. It does not compute road network distances or ETAs; those are retrieved
separately from Mapbox Directions.
–Client Pre-Optimization Heuristics: T o maintain responsiveness in the user interface, the
client includes a lightweight ‘routeOptimization‘ module. This module:
1. Generates a provisional stop ordering for a single route using a nearest-neighbor heuris-
tic.
2. Retries Mapbox Directions with progressively delayed intervals if a call fails.
3. Falls back to a simple sequential path (HQ → ordered stops → HQ) with estimated
metrics if external optimization is unavailable.
When a manager creates or edits a route, the clustering microservice is always invoked to pro-
duce a full cluster+ordering recommendation. The UI merges this authoritative recommenda-
tion with any provisional client result before presenting it to the manager. Once the recom-
mendation is available, the manager can either approve it as-is, adjust specific parts such as
reordering or reassigning stops, or replace it with a fully manual plan. Because the workflow
integrates clustering from the server, heuristics from the client, and metrics from Mapbox, the
system stays responsive, gives managers control, and produces a clear audit trail of decisions.
53

In practice, this setup lets the monolith handle everyday tasks eﬀiciently, while isolating the
heavy clustering workload so it cannot slow down normal API responses. The client heuristics
provide a safety net, keeping the interface usable even if external services are delayed.
#### Figure 3.1: High‐Level Architectural View, illustrating the interaction between the client, API,
data layers, and external optimization services.
54

#### Figure 3.2: Detailed Component Interaction Diagram, showing the flow of control and data
between controllers, middleware, services, and the persistence layer.
55

#### Figure 3.3: Multi‐Fleet Workflow Activity Diagram, detailing the end‐to‐end process from a
manager initiating route creation to final plan persistence.
56

### 3.1.2 Subsystem Decomposition
The system is decomposed into a set of bounded subsystems. Each subsystem owns discrete
responsibilities, exposes a clear integration surface (synchronous APIs and/or asynchronous
events), and persists or caches the data it requires. The decomposition supports independent
evolution, targeted scaling, and straightforward operational ownership.
#### Table 3.1: Subsystem Decomposition and Responsibilities
Subsystem Details
Client (Frontend)•Responsibilities: User interfaces for route planning, dashboards,
driver workflows and employee self-service; local pre-optimization
heuristics to keep the UI responsive; Mapbox rendering and inter-
action.
•Interfaces: HTTPS REST to /api/* , WebSocket/SSE channels
for live updates, and an internal routeOptimization module for
provisional ordering.
•Owned artifacts: Transient UI state, provisional route orderings
and client caches.
API / Application
Backend•Responsibilities: Domain orchestration, validation, tenant scop-
ing, RBAC enforcement, CRUD for canonical domain objects, ac-
ceptance and normalization of optimization artifacts, and exposi-
tion of background jobs and worker triggers.
•Interfaces: REST endpoints ( /api/routes ,/api/vehicles ,
etc.), WebSocket endpoints, and internal proxy routes to the Op-
timization Service ( /fastapi/* ).
•Owned artifacts: Canonical domain records (Routes, Employees,
V ehicles, PayrollRuns, etc.).
Optimization Service
(FastAPI)•Responsibilities: Multi-vehicle clustering and assignment; gener-
ate cluster proposals and initial intra-vehicle stop orderings. The
service does not compute road network geometry, distances, or
ETAs.
•Interfaces: POST /clustering ; ephemeral caching of run arti-
facts in Redis for hot retrieval.
•Owned artifacts: Ephemeral run identifiers; durable records are
persisted by the API layer.
Continued on next page
57

Subsystem Details
Mapbox & External
Routing•Responsibilities: Authoritative route geometry, distance, and ETA
metrics for an ordered coordinate sequence.
•Interfaces: Mapbox Directions/Matrix endpoints.
•Owned artifacts: Cached direction results (Redis) and persisted
metric snapshots (DB) where needed.
Notifications & Real-
time•Responsibilities: In-app notification generation, WebSocket fan-
out to drivers and admins, and fallback delivery via Email/SMS.
•Interfaces: /api/notifications , WebSocket channels, out-
bound email/SMS connectors.
•Owned artifacts: Notification records and delivery receipts.
Payroll & Analytics•Responsibilities: Aggregate completed routes and telemetry into
payroll runs and KPI surfaces; materialize views to support dash-
boards.
•Interfaces: /api/payroll ,/api/analytics and scheduled
worker jobs.
•Owned artifacts: PayrollRun snapshots, materialized views
(VehicleUtilizationView ).
Auth & T enant Man-
agement•Responsibilities: Session lifecycle, RBAC, tenant context binding
and provisioning. Sessions and claims are validated via the Better-
Auth Organization model.
•Interfaces: /api/auth/* , session cookies, and authentication
hooks for WebSocket handshakes.
•Owned artifacts: Users, Roles, Sessions, T enant records.
Audit & Compliance•Responsibilities: Immutable logging of critical actions, compli-
ance exports, and SIEM integration.
•Interfaces: /api/audit/* and export utilities.
•Owned artifacts: Append-only AuditEvent ledger (hash-
chained).
Integration and Orchestration Patterns
Synchronous user flows use HTTPS REST between client and API; clustering requests are al-
ways issued to the Optimization Service when a manager creates or edits a route. Metric en-
58

richment (Mapbox) is performed in parallel; the UI merges server recommendation and client
provisional heuristics before presenting the combined candidate plan for managerial review .
Asynchronous processing uses Redis streams/BullMQ for durable queues: payroll aggregation,
notification fan-out, plan persistence, and analytic materialization are handled by worker pro-
cesses. Data ownership is explicit: the API layer owns durable persistence; the Optimization
Service remains stateless for scaling and testability .
59

#### Figure 3.4: Subsystem Component View showing data ownership and key interactions.
60

### 3.1.3 Data Persistence and Schema Design
This section defines the authoritative persistence architecture, multi-tenancy mechanics, entity
model boundaries, optimization artifacts, indexing and performance strategy, and operational
guarantees. The contents below are intended for inclusion in the SDD (conceptual and opera-
tional design); detailed table/DDL fragments belong to the ODD or implementation appendices.
Persistence strategy
•Primary store: PostgreSQL is the canonical system of record. All domain mutations pass
through the service layer and Prisma ORM; ad-hoc SQL in business logic is avoided. Migra-
tions are managed by Prisma Migrate under CI with shadow DB drift detection.
•Caching & queues: Redis is used for short- TTL distance/duration matrix fragments (keyed
by ‘organizationId‘ + scopeHash), provisional clustering outputs prior to acceptance, hot
lookups (recent routes, unread notification counts), and lightweight job orchestration (Redis
streams / BullMQ).
•Optimization service persistence model: The FastAPI clustering microservice is stateless
and emits proposals (ClusterPlan payloads containing vehicle assignments, candidate order-
ings and cost metrics). The API layer normalizes those proposals and persists them as Clus-
terPlan and optional RecommendationDiff rows. Redis stores hot matrices and transient plans
for quick retrieval.
61

#### Figure 3.5: Core Operational ERD ‐ 1
62

#### Figure 3.6: Optimization ERD ‐ 2
63

#### Figure 3.7: Observability & Analytics ERD ‐ 3
64

Core Logical Entities
•Organization —organizationId (PK),
name ,status
•User —userId (PK),organizationId ,
email ,role ,status
•Employee —employeeId (PK),
organizationId ,userId? ,employmentType ,
shiftGroup ,status
•V ehicle —vehicleId (PK),organizationId ,
category ,capacity ,status
•Stop —stopId (PK),organizationId ,
latitude ,longitude ,pointGeom (gener-
ated),address
•Route —routeId (PK),organizationId ,
vehicleId? ,clusterPlanId? ,routeDate ,
status ,version
•RouteStop —routeStopId (PK),
routeId ,stopId ,sequence ,planned/actual
timestamps ,eta ,distance
•EmployeeStop — PK ( employeeId ,
stopId ,organizationId ),validFrom ,
validTo ,active•ClusterPlan —clusterPlanId (PK),
organizationId ,generatedAt ,optimizerVersion ,
hash ,planType ,scopeHash
•RecommendationDiff —diffId
(PK), routeId ,organizationId ,
provisionalHash ,recommendedHash ,
accepted ,createdAt
•PayrollRun —payrollRunId (PK),
organizationId ,periodStart ,periodEnd ,
totalHours ,totalAllowance ,status ,
checksum
•V ehicleUtilizationView — materialized
view:vehicleId ,organizationId ,date ,
utilizationPct
•Notification —notificationId (PK),
organizationId ,userId ,type ,
severity ,read ,createdAt
•AuditEvent —auditEventId (PK),
organizationId ,actorUserId ,entityType ,
entityId ,action ,timestamp ,integrityHash ,
previousHash
Integrity Rules and Constraints (Selection)
•T enant composite FKs: All tenant-scoped foreign keys include organizationId to prevent
cross-tenant FK resolution.
•Unique constraints: e.g.,UNIQUE (organizationId, routeDate, vehicleId) enforces
one vehicle per route per day; UNIQUE (organizationId, hash) guardsClusterPlan
uniqueness.
•Sequence constraints: UNIQUE (routeId, sequence) onRouteStop plus application val-
idation to ensure contiguous sequences.
•Accepted diff constraint: Partial unique index to ensure at most one RecommendationDiff
perRoute hasaccepted = TRUE .
65

•Audit chain: Trigger or background job validates previousHash continuity to enforce append-
only integrity .
Indexing and Performance Strategy
•Tactical composite indexes: (organizationId, status, routeDate) onRoute ;(routeId,
sequence) onRouteStop ; partial index for recent unaccepted RecommendationDiff en-
tries.
•Spatial indexing: GiST/SP-GiST onStop.pointGeom (PostGIS) for geospatial queries;
geohash used for coarse prefiltering.
•JSONB strategy: Parameters and cost metrics persist in JSONB ;GIN indexes are added only
for frequently queried JSON keys.
•Materialized views: Incremental refresh after route completion or on schedule to support
dashboards ( VehicleUtilizationView ).
•Hot path caching: Cached distance matrices keyed by (organizationId, scopeHash) in
Redis to serve repeated reclustering scenarios.
Transactions, Idempotency, and Concurrency
•Atomic publication: Publishing a Route is an atomic transaction bundling Route ,RouteStops ,
optional accepted RecommendationDiff , andClusterPlan link.
•Optimistic concurrency: Route.version supports compare-and-swap for resequencing;
clients refresh projections on conflict.
•Idempotency: Cluster submissions include (organizationId, scopeHash, planType)
to short-circuit duplicate work and return cached plans.
Backup, Retention, and Recovery
•Backup policy: Nightly base backups + continuous W AL archiving for PITR; automated
monthly restore drills.
•Retention defaults: AuditEvents 12 months (configurable), Notifications 90 days, op-
timization artifacts 90 days with optional archival to object storage.
•RPO/RTO targets: RPO < 5 minutes (W AL), RTO < 30 minutes (documented runbooks and
DR procedures).
Schema Migration and Deployment
•Migration flow: Prisma Migrate executed in CI with a shadow DB; migrations applied with
blue/green or rolling strategies where needed.
66

•Safe change patterns: Add nullable columns first; backfill with workers; migrate to NOT
NULL only after parity . Emergency rollbacks use compensating migrations where forward
fixes are impractical.
### 3.1.4 Deployment and Runtime View
This section describes how Routegna is packaged, deployed, scaled, observed, and operated
across environments. All deployable units are produced as container images via CI (multi-stage
Docker builds). Infrastructure is defined as code (Helm charts + environment overlays). The
runtime topology, scaling rules, and operational controls reflect the production posture and the
staging/development topologies used for validation.
Environment T opologies
#### Table 3.2: Environment Topologies
Environment T opology Summary & Purpose
Development Localdocker-compose stack: API (Node/T ypeScript), FastAPI
(Python), Postgres (single instance), Redis (single), MailHog (SMTP
capture), optional OpenAPI UIs.
Purpose: rapid iteration, hot reload, local prototyping; minimal secu-
rity hardening.
Staging Single-region Kubernetes: API Deployment (HP A), FastAPI Deploy-
ment, W orker Deployment, WebSocket-enabled API pods, managed HA
Postgres, Redis, LaunchDarkly client, OpenT elemetry collector, ingress
with TLS.
Purpose: pre-production validation—integration, load & migration re-
hearsals; blue/green and canary tests.
Production Multi-AZ Kubernetes: autoscaling API pods, dedicated WebSocket
gateway, isolated FastAPI deployment, worker pool (queue consumers),
CronJobs; HA Postgres cluster (primary + read replicas), Redis
Cluster/Sentinel, External DNS + Ingress (TLS), OT el Collector →
Prometheus + Trace Exporter + SIEM, secrets manager (V ault/KMS).
Purpose: high availability, resilience under zone loss, audited opera-
tions with controlled change windows.
Runtime Components and Scaling
67

#### Table 3.3: Runtime Components and Scaling Characteristics
Component Responsibility / Scaling Characteristics
API Service
(Node/TS)REST endpoints, orchestration, auth, persistence, WS auth. HP A by
CPU + latency; stateless (session state and caches in Redis).
W ebSocket Gateway Real-time route/notification push and driver telemetry . Scales inde-
pendently for fan-out; connection-sticky ephemeral state.
FastAPI Optimization
ServiceClustering + ordering computations (stateless compute). Scales on
CPU and queue depth; consumes Redis matrices; applies backpres-
sure when overloaded.
W orker Processes Payroll aggregation, materialized view refresh, diff acceptance, ex-
ports. Queue-depth scaling (BullMQ / Redis streams); stateless.
Redis Caching (distance/duration matrices, hot plans), queue + stream
backend. Clustered/sharded; stateful.
PostgreSQL System of record (multi-tenant). HA primary + replicas; stateful;
RLS applied for tenant enforcement.
Observability Stack Metrics, traces, logs ( OTel Collector →Prometheus / SIEM ).
Horizontally scalable collectors; ephemeral ingestion nodes.
Feature Flag Client LaunchDarkly SDK embedded; stateless; safe-mode defaults if SDK
unavailable.
Deployment Workflow (CI/CD Summary)
•Developer push → CI runs lint, tests, type-check, Prisma migrations (shadow DB).
•Build images (multi-stage) → SBOM + vulnerability scan.
•Push→ Staging Helm release (rolling / blue/green).
•Automated integration + synthetic routing load/regression tests.
•Manual approval → Production Helm release (gradual canary subset).
•Post-deploy smoke tests: health, auth, route creation, clustering run.
•Canary metrics observed: error rate, p95 latency, queue depth, etc.
•Auto rollback triggers: sustained 5xx above SLO, queue backlog > threshold, auth error spike,
clustering timeout surge.
68

Resilience & Recovery Patterns
#### Table 3.4: Resilience and Recovery Patterns
Scenario Strategy
FastAPI pod exhaustion HP A + queue backpressure; graceful degraded response.
Redis node failure Sentinel/cluster failover; reconnect logic with exponential
backoff.
Postgres primary loss Provider/Patroni automatic promotion; connection retry and
failover.
Route publish concurrency Optimistic CAS on Route.version ; client receives 409 with
latest projection.
Distance matrix cache stam-
pedeSingle-flight request coalescing, TTL jitter, and scopeHash in-
validation.
Feature flag outage Local bootstrap defaults; fail-open (configurable safe-mode).
W ebSocket overload Backpressure + prioritized delivery + degrade to polling fall-
back.
W orker backlog surge Scale worker pool; shed low-priority jobs if SLA at risk.
Plan recomputation storm Cache keyed by (orgId, scopeHash, planType) ; early re-
turn on duplicates.
Observability & Operations
•Metrics: latency (p50/p95/p99), throughput, queue depth, success rates, replica lag.
•Tracing: cross-service (API ↔ FastAPI ↔ Redis) with W3C / OT el context.
•Logging: structured JSON including correlation ID and organizationId .
•Alerting: SLO burn, queue lag, optimization failure ratio, replication lag, WebSocket dis-
connect spikes.
•Audit: immutable AuditEvent hash chain; nightly integrity re-hash job.
•Security: non-root containers, PoLP , network policies, sealed secrets/V ault, DB RLS.
•Compliance: trace & audit export endpoints gated to admin roles.
High-Level Runtime Flow (Example) Client requests optimization → API checks cache →
enqueues clustering → FastAPI computes plan and stores in Redis → API persists ClusterPlan
69

→ UI merges results → manager accepts/adjusts → final route persisted → workers refresh
views asynchronously .
### 3.1.5 Key Decisions and Trade‐offs
#### Table 3.5: Key Design Decisions and Trade‐offs
Decision Rationale / Trade-offs / Mitigations
Hybrid modular monolith
+ isolated optimization mi-
croserviceRationale: core remains cohesive; Python ecosystem leveraged
for solvers; clustering scales independently . T rade-offs: cross-
service latency . Mitigations: Redis colocation, circuit break-
ers, cache of recent plans.
Shared multi-tenant Post-
gres (single schema)Rationale: simpler ops, eﬀicient use, unified analytics. T rade-
offs: noisy-neighbor risk. Mitigations: RLS (deny by default),
composite FKs, pooling, future shard thresholds.
Session-based auth + multi-
IdP federationRationale: strong tenant binding and extensibility . T rade-offs:
Redis session dependency . Mitigations: hardened Redis, secret
rotation, secure cookie attributes.
Prisma ORM + disciplined
migrationsRationale: type safety, developer velocity, CI validation.
T rade-offs: abstraction overhead. Mitigations: raw SQL es-
cape hatches, query plan monitoring.
Redis as cache + queue Rationale: operational consolidation. T rade-offs: workload
contention. Mitigations: keyspace separation, monitoring, op-
tion to split later.
RecommendationDiff
history modelRationale: supports rollback and audit trail. T rade-offs: ex-
tra storage. Mitigations: partial indexes, TTL/archival cleanup
jobs.
Optimistic concurrency
(Route.version )Rationale: scales without locking. T rade-offs: clients must
retry on 409 conflicts. Mitigations: retry backoff with jitter,
clear error semantics.
Materialized views for ana-
lyticsRationale: offload OL TP , stable dashboards. T rade-offs: even-
tual consistency . Mitigations: event-driven + scheduled re-
fresh; SLA staleness windows.
Distance matrix caching
(scopeHash )Rationale: reduce recomputation cost & latency . T rade-offs:
staleness risk. Mitigations: deterministic invalidation, TTLs,
hash verification.
70

Decision Rationale / Trade-offs / Mitigations
Feature flag system
(LaunchDarkly)Rationale: progressive delivery, safe rollouts. T rade-offs: ex-
ternal dependency risk. Mitigations: local fail-open safe-mode
defaults and short SDK timeouts.
Immutable ClusterPlan
post-activationRationale: reproducibility, audit integrity . T rade-offs: new
plan required for changes. Mitigations: plan lineage via
scopeHash /planType , diffs for changes.
Monorepo (pnpm
workspaces)Rationale: shared types, unified CI. T rade-offs: larger build
graph. Mitigations: incremental caching, parallel execution,
selective CI triggers.
Deferred T opics
#### Table 3.6: Deferred Topics and Revisit Triggers
T opic Current Stance; Revisit Trigger
Sharding / partitioning Deferred; revisit when route volume or hotspots exceed thresh-
olds.
CQRS read-model split Deferred; revisit if OL TP latency is degraded by analytical
load.
Outbox / CDC events Planned; revisit when integrations exceed a configured thresh-
old.
Column-level encryption Deferred; revisit if tenant compliance requirements escalate.
Principles Reinforced
•Immutability for audit-critical artifacts ( ClusterPlan lifecycle).
•Layered performance path: cache → compute → persist→ derive.
•Observability gating deployments (no release without core metrics).
•Fail-fast and degrade gracefully with explicit signals.
•Backward-compatible additive schema migrations.
Summary The deployment and runtime model optimizes for operational clarity, resilience,
and controlled complexity—keeping the core cohesive, isolating only compute-heavy optimiza-
tion, and deferring heavier distributed patterns until scale clearly demands them.
71

3.2. Object Design Document (ODD)
This section specifies the object-level design that implements the SDD. Conventions: PascalCase
for classes, camelCase for methods, DTOs derived from Prisma schema, validation via Zod
(executed at ingress and internal boundaries).
### 3.2.1 Package and Module Decomposition
#### Table 3.7: Package and Module Decomposition
Package / Module Responsibilities & Key Dependencies
Bootstrap
(server/src/app.ts )Compose Express app, register middleware (BetterAuth Organi-
zation middleware), mount routes, init WebSocket hub. Depends:
express ,@better-auth ,pino ,ws.
Middleware
(server/src/middleware/ )Auth, RBAC, tenant scoping, validation, error translation. Injects
organizationId into request context. Uses zod , shared error
types.
Routes / Controllers
(server/src/routes/ )Thin HTTP → service adapters for /routes ,/employees ,
/vehicles ,/payroll ,/notifications ,/analytics .
Services
(server/src/services/ )Domain orchestration: RouteService ,
ClusteringOrchestrator , NotificationService ,
PayrollService ,AnalyticsService ,AuditLedger . In-
tegrates Prisma, Redis, Mapbox, FastAPI client.
Jobs / Workers
(server/src/jobs/ )Queue processors (BullMQ / Redis streams): payroll, MV refresh,
notification fan-out, cluster recompute. Idempotent handlers and
# DLQ.
Prisma
(server/prisma/ )DB schema, migrations, seed scripts, generated types used as
canonical DTOs.
Shared Contracts
(packages/shared/ )DTOs, validation schemas and helpers (derived from Prisma) to
keep client/server parity .
Client
(packages/client/src )React SP A: RouteAssignmentWizard , Map components,
Driver views, Notification drawer, KPI dashboards, lo-
calrouteOptimization heuristic. Depends: react ,
tanstack-query ,mapbox-gl .
Config
(packages/shared/config )Env loaders, LaunchDarkly client config, logging settings, secrets
wiring.
### 3.2.2 Key Class and Interface Descriptions
72

#### Table 3.8: Key Backend Class and Module Interfaces
Class / Module Key methods, purpose, representative exceptions
AuthService authenticate(code) ,verifySession(sessionId) . Handles
OAuth callbacks, sessions, BetterAuth Organization binding. Ex-
ceptions: AuthenticationError ,UnauthorizedError .
T enantContextMiddleware resolve(req,res,next) . Injects organizationId for RLS;
validates tenant. Exceptions: TenantNotFoundError .
RouteService createRoute(draft) ,acceptRecommendation(routeId,
planId) , updateRoute(routeId,patch) ,
dispatchRoute(routeId) . AL W A YS invokes cluster-
ing orchestrator, merges client heuristic, requests met-
rics, persists RecommendationDiff /ClusterPlan , en-
forces optimistic concurrency via version . Excep-
tions: ValidationError ,CapacityExceededError ,
DiffConflictError ,RouteNotFoundError .
ClusteringOrchestrator requestPlan(scope) . HTTP adapter to FastAPI clustering mi-
croservice — returns vehicle →employee assignments and initial
ordering. Does NOT compute map directions/ETAs. Exceptions:
OptimizationTimeoutError ,ClusterGenerationError .
NotificationService create(dto) ,markRead(userId,ids) ,fanOut(event) . Per-
sist + dispatch via WS/SSE/email fallback. Exceptions:
DeliveryError .
PayrollService runPayroll(tenantId,period) ,
export(tenantId,period,format) . Aggregate trips,
create PayrollRun , export CSV/PDF. Exceptions:
PayrollRunExistsError ,ExportGenerationError .
AnalyticsService getKpi(tenantId) , refreshMaterializedViews() .
Query materialized views; cache snapshots. Exceptions:
AnalyticsUnavailableError .
AuditLedger append(event) ,query(filters) . Append-only hash-chained
events. Exceptions: IntegrityViolationError .
73

#### Table 3.9: Key Frontend Component Contracts
Component / Module Public hooks / props & purpose
RouteAssignmentWizard useRecommendation() ,onAccept(plan) ,onAdjust(diff)
— route creation UI: metadata → recommendation → manual
override → persist.
NotificationDrawer useNotifications() ,markSeen(ids) — live drawer; WS pri-
mary, SSE fallback.
PayrollReportPage usePayrollRun(period) ,export(format) — payroll genera-
tion and export.
DriverPortal useAssignedRoute() ,updateStopStatus(stopId,status)
— mobile map + ordered stops + status updates.
#### Table 3.10: Domain Entity Snapshot
Entity Core Fields
Route routeId, organizationId, vehicleId, routeDate,
status, version
RouteStop routeStopId, routeId, stopId, sequence,
plannedArrivalTime
ClusterPlan clusterPlanId, organizationId, hash, planType,
scopeHash
RecommendationDiff diffId, routeId, provisionalHash, recommendedHash,
accepted
PayrollRun payrollRunId, organizationId, periodStart,
periodEnd, totalHours
Notification notificationId, userId, type, severity, read
AuditEvent auditEventId, entityType, integrityHash,
previousHash
### 3.2.3 Error Handling and Exception Strategy
#### Table 3.11: Error Handling and HTTP Status Codes
Error Handling & HTTP code
ValidationError 400 — return structured RFC7807 response; client fixes input.
CapacityExceededError 409 — present to user; allow corrective edit.
74

Error Handling & HTTP code
RouteNotFoundError 404 — inform user; no retry .
DiffConflictError 409 — return latest projection; client must reapply changes.
OptimizationTimeoutError 503 — surface degraded UI; client heuristic used.
ClusterGenerationError 503 — fallback to client heuristic; queue retry .
ExternalServiceError 502/503 — circuit breaker; retry policies; degrade gracefully .
PersistenceError 500 — alert ops; retry where idempotent.
IntegrityViolationError 500 — escalate; critical.
Propagation rules
•Controllers: attachcorrelationId +organizationId , pass to central ErrorMiddleware .
•Services: raise domain-specific DomainError objects with code ,message ,details .
•Repositories: wrap DB/network errors into PersistenceError orExternalServiceError .
•W orkers: idempotent retries with backoff; DLQ for persistent failures.
•Client: map server problems into AppError with i18n keys and friendly UI text.
Canonical Error Example (RFC7807)
{
"type": "https://docs.routegna.dev/errors/validation",
"title": "Validation Error",
"status": 400,
"code": "VALIDATION_ERROR",
"correlationId": "c6f9b5a2-...",
"organizationId": "org_123",
"details": [
{ "field": "routeDate", "message": "Must be in YYYY-MM-DD format" }
]
}
### 3.2.4 UML Diagrams
The following diagrams visually represent the system’s object-level design and runtime behav-
ior, translating the architectural principles into concrete implementation models. They are cat-
egorized into structural diagrams, which illustrate the static relationships between components,
and sequence diagrams, which detail key dynamic interactions.
75

Architectural & Structural Diagrams
#### Figure 3.8: Component Diagram: Application Services & Infrastructure Dependencies
Domain Class Diagram
76

#### Figure 3.9: Domain Class Diagram: Entities & Relationships
77

#### Figure 3.10: Layer Diagram: Service & Infrastructure Layers
78

#### Figure 3.11: Package Diagram: Backend
79

#### Figure 3.12: Component Diagram: Frontend Component Hierarchy
80

#### Figure 3.13: Data Flow Diagram: Frontend Architecture
81

#### Figure 3.14: Activity Diagram: Vehicle Availability Fallback Logic
82

Sequence Diagrams
#### Figure 3.15: Sequence Diagram: Create Route with Clustering
83

#### Figure 3.16: Sequence Diagram: General Route Creation Flow
84

#### Figure 3.17: Sequence Diagram: Shift‐Wide Optimization (Multi‐Route Draft Generation)
85

#### Figure 3.18: Sequence Diagram: Shift Preparation Clustering Flow
86

#### Figure 3.19: Sequence Diagram: Notification Delivery
87

#### Figure 3.20: Sequence Diagram: Vehicle‐to‐Route Assignment
88

#### Figure 3.21: Sequence Diagram: Editing an Existing Route
89

#### Figure 3.22: Sequence Diagram: Route Status Activation
90

#### Figure 3.23: Sequence Diagram: Employee Assignment to Routes
91

#### Figure 3.24: Sequence Diagram: Employee Assignment Flow (UI/Backend Interaction)
92

#### Figure 3.25: Sequence Diagram: Adding a New Vehicle
93

#### Figure 3.26: Sequence Diagram: Payroll and Analytics Process
94

#### Figure 3.27: Sequence Diagram: Tenant‐Scoped Authentication & Data Fetch
95

### 3.2.5 State Transition Rules
The system implements strict business logic for managing state transitions in both route and
vehicle lifecycles. These rules ensure operational integrity while preventing invalid state com-
binations that could compromise fleet management.
Route State Transitions
#### Figure 3.28: State Machine diagram for the Route Lifecycle, illustrating the transitions between
statuses like ACTIVE ,INACTIVE , andCANCELLED .
96

V ehicle State Transitions
V ehicle status management incorporates complex business logic around maintenance schedul-
ing, driver assignments, and operational availability across A V AILABLE, IN_USE, MAINTE-
NANCE, OUT_OF_SER VICE, and INACTIVE states. The state machine diagram shows the
comprehensive transition rules and automatic actions triggered during status changes.
#### Figure 3.29: State Machine diagram for Vehicle Status, showing the operational states from
AVAILABLE andIN_USE to maintenance states like OUT_OF_SERVICE .
Critical business constraints prevent vehicles with active routes from being placed into mainte-
nance or out-of-service status, ensuring operational continuity . Driver assignments are automat-
ically managed during status transitions, with unassignment occurring when vehicles move to
non-operational states. Maintenance scheduling automatically calculates next service dates, and
all transitions are validated against current route assignments to maintain system consistency .
97

# Chapter 4 – Implementation Report
4.1. Development Environment and Technology Stack
The Routegna platform employs a modern, polyglot architecture to deliver enterprise-grade
fleet management capabilities. This section inventories the complete technology stack, catego-
rized by functional domain, with precise version specifications drawn from project configuration
files (package.json ,pyproject.toml ,requirements.txt ,Dockerfile , anddocker-com
pose.yml ). V erified components (backend service, clustering microservice, and React client)
interoperate via the documented HTTP/ /fastapi proxy and shared Better Auth session model
within the pnpm monorepo; no additional hidden services or infrastructure layers (e.g. Redis
cache, message queue) are present.
Core Backend
The backend service, housed in packages/server , provides RESTful APIs for CRUD op-
erations, authentication, and data persistence. It leverages Node.js for runtime eﬀiciency and
Express for routing and middleware composition.
•Runtime and Framework :
–Node.js runtime (not pinned; pnpm@10.x and Express 5 require Node ≥18).
–Express5.1.0 (packages/server/ package.json ) for HTTP server management, mid-
dleware stacking, and API routing.
•Execution and Compilation :
–tsx4.20.3 (root) powers T ypeScript scripts and the server-side nodemon dev workflow,
while the client relies on vite5.0.0 for its hot-reload development server; the client’s tsx
### 4.19.3 install is limited to utility scripts.
Optimization Microservice
The clustering service, located in clustering/ , implements heuristic route assignment using
OR- T ools. Containerized for portability, it exposes a FastAPI interface for solver invocations,
ensuring scalable optimization without blocking the main backend.
•Runtime and Framework :
–Python3.11 (base image in clustering/Dockerfile ).
–FastAPI 0.109.0 withuvicorn0.27.0 for asynchronous API serving and automatic
OpenAPI documentation generation.
•Core Dependencies :
98

–numpy1.26.3 for numerical computations and matrix operations.
–haversine2.8.0 for geodesic distance calculations.
–ortools (latest) for constraint programming and vehicle routing optimization.
–httpx0.28.1 for HTTP client operations, including authentication proxying.
•Additional Libraries :
–folium andrequests for visualization and external API interactions (declared in pypro
ject.toml ).
•Containerization and Orchestration :
–Dockerized via clustering/Dockerfile withuv package manager for eﬀicient depen-
dency caching.
–Orchestrated using docker-compose.yml (Compose v3.8) for local development and health
checks.
Frontend
The client application, in packages/client , delivers a responsive web interface for fleet oper-
ations. Built with React and Vite, it emphasizes performance, accessibility, and role-based UI
adaptation.
•Framework and Runtime :
–React18.3.1 withreact-dom18.3.1 for component-based UI development.
–react-router-dom6.20.1 for client-side routing and navigation guards.
•Build T ooling :
–Vite5.0.0 with@vitejs/plugin-react4.2.0 and@vitejs/plugin-react-swc3.5.0
for fast bundling and hot module replacement.
•Styling and Theming :
–tailwindcss3.3.5 withtailwindcss-animate1.0.7 for utility-first CSS.
–next-themes0.4.4 for dark/light mode support.
–@emotion/react11.11.3 for styled components where needed.
Database & Data Layer
Data persistence relies on PostgreSQL with Prisma ORM for type-safe queries. The schema
(packages/server/pris ma/schema.prisma ) defines entities for organizations, routes, vehi-
cles, and more, with migrations ensuring schema evolution.
•Database :
–PostgreSQL datasource (configured in packages/server/pris ma/schema.prisma ).
99

•ORM and T ooling :
–@prisma/client6.13.0 withprisma CLI6.13.0 for query generation and migration
management.
–Prisma migrations/seeds via prisma/seed.ts and migration scripts stored under pack
ages/server/pris ma/migrations/ .
Caching & Job Queues
No dedicated caching or job queue systems are implemented in the current stack. Asynchronous
tasks (e.g., solver invocations) are handled via native asyncio in the Python service, with no
Redis or BullMQ dependencies present. Earlier SDD/ODD drafts explored Redis and BullMQ,
but those components were deliberately descoped for the first release and remain optional future
enhancements.
Authentication
Authentication and authorization are centralized through Better Auth, supporting multi-tenant
organization scoping and session-based access control. Integration with Fayda provides local
identity provider capabilities.
•Primary Library :
–better-auth (1.3.8 root tooling, 1.3.4 server,1.1.16 client,shared package) for
OAuth2 flows, session management, and permission checks.
•Supporting Libraries :
–fayda0.0.14 for local authentication provider integration.
–bcrypt6.0.0 andjsonwebtoken9.0.2 for password hashing and token issuance.
Core Libraries (Backend)
The backend stack includes utilities for HTTP handling, validation, logging, and real-time fea-
tures, all integrated via Express middleware.
•HTTP and Middleware :
–cors2.8.5 for cross-origin requests.
–express-async-handler1.2.0 for error handling in async routes.
–express-fileupload1.5.2 andexpress-validator7.2.1 for file uploads and input
validation.
•V alidation and Schema :
–zod4.1.1 (server) with custom middleware wrappers for runtime type checking.
•Observability :
100

–pino9.3.2 ,pino-http10.3.0 , andpino-pretty11.2.2 for structured logging and
HTTP request tracing.
•Realtime & Messaging :
–socket.io 4.8.1 for WebSocket-based notifications and live updates.
•Utilities :
–dotenv17.2.1 for environment variable loading.
–pdfkit0.15.0 for server-side PDF generation.
–shared workspace module for cross-package utilities.
Core Libraries (Frontend)
The frontend leverages a rich ecosystem of libraries for data fetching, UI components, visual-
ization, and file handling, ensuring a polished user experience.
•Data Handling & UI :
–axios1.7.9 for HTTP requests.
–@tanstack /react-table8.20.6 for sortable, filterable data tables.
–class-variance-authority0.7.1 andclsx2.1.1 for conditional styling.
–usehooks-ts2.16.0 ,lodash4.17.21 , anddate-fns4.1.0 for utility functions and
date manipulation.
•Visualization :
–d37.9.0 ,d3-force3.0.0 ,recharts 2.15.0 , andchart.js 4.4.7 for interactive
charts and graphs.
–framer-motion11.14.4 for animations and transitions.
•Component Frameworks :
–Radix UI suite ( @radix-ui/react-*1.1.x/2.1.x) for accessible primitives.
–@headlessui/re act2.2.0 for unstyled UI components.
–lucide-react0.468.0 for iconography .
–vaul1.1.2 for drawer components.
–sonner2.0.1 for toast notifications.
•File & Document T ooling :
–react-dropzone14.3.5 for drag-and-drop file uploads.
–papaparse5.4.1 andxlsx0.18.5 for CSV/Excel parsing.
–jspdf3.0.0 withjspdf-autotable5.0.2 for client-side PDF generation.
•Maps & Scheduling Widgets :
101

–mapbox-gl3.8.0 for interactive mapping.
–react-day-picker8.10.1 for date selection.
–socket.io -client4.8.1 for real-time client connections.
Development & Tooling
The project adopts modern tooling for monorepo management, type safety, testing, and deploy-
ment, facilitating collaborative development and CI/CD integration.
•Package Management :
–pnpm (10.14.0 root,10.10.0 server) for eﬀicient dependency resolution and workspace
orchestration.
•T ypeScript Compilers :
–typescript5.9.2 (server),5.7.2 (client),5.8.3 (shared) for static type checking.
•T esting Frameworks :
–vitest2.1.4 with@vitest/ui and@vitest/ coverage-v8 for backend unit/integration
tests.
–jest29.7.0 with@testing-library/re act14.1.2 and@testing-library/jest-
dom6.1.5 for frontend component testing.
–supertest7.0.0 for API endpoint validation.
•Linting & Code Quality :
–eslint8.53.0 with@typescript-eslint plugins8.40.0 ,eslint-plugin-react7.33.2 ,
eslint-plugin-react-hooks4.6.0 , andeslint-plugin-react-refresh0.4.4 for
code standards.
•Build & Development Scripts :
–nodemon3.1.10 for backend hot-reloading.
–ts-node10.9.2 andbabel-jest29.7.0 for transpilation.
–postcss8.4.32 andautoprefixer10.4.14 for CSS processing.
•Automation & Documentation :
–task-master-ai0.24.0 for task orchestration.
–Docker tooling ( clustering/Dockerfile ,docker-compose.yml v3.8) for container-
ized services.
102

4.2. Implementation of Key Modules and Algorithms
### 4.2.1 Core Backend Service Implementation (Node.js/Express)
Layered Architecture Overview
The backend follows a layered Express → Router → Handler/Service structure. createApp
(packages/server/s rc/app.ts ) bootstraps global middleware—CORS, JSON parsing, Bet-
ter Auth adapters, structured logging, and a lightweight rate limiter—before delegating to the
aggregated API router ( routes/in dex.ts ).index.ts hosts HTTP startup logic and wires
Socket.IO on top of the HTTP server for realtime updates. Each feature exposes its own route
module (for example, routes/routes.ts for shuttle routes) that composes middleware, vali-
dates requests, and interacts with Prisma-powered services.
Request Lifecycle and Middleware Chain
1. Transport & Logging – Requests enter Express and are optionally logged via pino /pino-
http , depending on environment flags.
2. Security & Auth –/api/auth/* routes are delegated to Better Auth’s Node adapter
(toNodeHandler(auth) ). Protected business routes attach requireAuth to hydrate
req.user /req.session from Better Auth and, when applicable, requireRole or permis-
sion checks using auth.api.hasPermission .
3. Organization/T enant Scoping – Handlers that need tenant context call helpers
inmiddleware/organization.ts to load organization memberships and determine
req.activeOrganization from the Better Auth session. Many route handlers (includ-
ing the create-route flow) read req.session.session.activeOrganizationId directly
to scope Prisma queries.
4. V alidation Layer – Incoming payloads are vetted via Zod-backed middleware ( vali
dateSchema /validateMultiple insideroutes/routes.ts ) to ensure DTOs are well-
formed before touching the data layer.
5. Controller/Handler Execution – Route definitions in routes/* modules contain the or-
chestration logic. They gather metadata, invoke helper services (such as VehicleAvail abil
ityService ), and wrap state-changing operations in Prisma transactions where consistency
is required.
6. Service & Persistence Layer – Database access is funneled through the singleton Prisma
client (db.ts ). Supporting services (for example, VehicleAvail abilityService ) encap-
sulate reusable queries and business rules, while transactions enforce atomic updates of re-
lated tables. Cross-service calls (e.g., to the clustering FastAPI) travel through the /fastapi
103

proxy middleware, which forwards HTTP requests to the Python microservice with appro-
priate headers and payloads.
This flow keeps middleware concerns orthogonal to business logic while ensuring authentica-
tion, tenant scoping, and validation are executed before any Prisma mutation occurs.
Key Module Responsibilities
•Route orchestration ( routes/routes.ts )– Although no dedicated RouteService.ts
exists, the route module itself acts as the service layer for shuttle routing. It implements
superadmin-specific CRUD and organization-scoped user endpoints, performs permission
checks with Better Auth, validates organization ownership for related entities (vehicles, shifts,
locations), and wraps the create-route flow inside a prisma.$transaction block so stops,
employee assignment flags, and vehicle availability records update atomically . Update and
delete handlers issue targeted Prisma mutations outside a transaction, immediately mirroring
availability and assignment flags afterward to keep related tables consistent.
•V ehicleA vailabilityService ( ser vices/ve hi cleAvail abil ity Ser vice.ts )– Provides
two exported utilities:
–getAvail ableVehicles filters vehicles by organization, VehicleStatus , and existing
non-cancelled routes before returning enriched vehicle metadata for scheduling screens.
–checkVehicleAvail ability verifies a proposed route window by checking vehicle status
flags, overlapping routes, and prior vehicleAvail ability records. Both helpers surface
“available/false + reason” semantics to calling handlers, allowing HTTP responses to accu-
rately reflect scheduling conflicts. A VehicleAvail abilityService class offers wrapper
methods for legacy callers, and legacy getAvail ableShut tles /ShuttleAvail ability
Service maintain backwards compatibility with historic naming.
•PayrollService ( ser vices/ pay rollSer vice.ts )– Currently encapsulates payroll report-
ing stubs. Methods such as generateMonthlyPayroll ,getMonthlyPayrollByVehicle ,
andprocessPayroll return structured payloads describing the requested scope. Although
the implementation is placeholder (completing business logic is tracked separately), the inter-
face defines the contract consumed by hypothetical controllers for payroll analytics and export
workflows and documents the extension points for the planned automation work.
Create Route Sequence (Organization-Scoped Endpoint)
Route creation is implemented inside routes/routes.ts underrouter.post('/') . The
handler coordinates authentication, validation, availability checks, and persistence. The follow-
ing pseudo-code mirrors the production implementation and illustrates the full control flow:
104

1handleCreateRoute(request) :
# 2 dto=validate(CreateRouteSchema, request.body)
# 3 activeOrgId =request.session ?.session ?.activeOrganizationId
# 4 assertactiveOrgId exists->otherwise 400"Active organization not found"
5
# 6 // Authorization & contextual lookups
# 7 hasPermission =auth.api.hasPermission(headers :
fromNodeHeaders (request.headers), body:{permissions :{route:['create' ]
}}),→
,→
# 8 abort403 ifBetterAuthdenies`route:create`
# 9 ensurevehicleId, shiftId, date,locationId present (400onmismatch)
# 10 location =prisma.location.findFirst({ where:{id: locationId ,organizationId :
activeOrgId }}) ,→
# 11 abort400 iflocation missing orcross-tenant
12
# 13 // Duration guard & shift alignment
# 14 reject ifdto.totalTime >90minutes (business constraint)
# 15 shift=prisma.shift.findFirst({ where:{id: shiftId,organizationId :
activeOrgId }}) ,→
# 16 abort404 ifshiftmissing
# 17 startTime =shift.endTime
# 18 endTime = newDate(startTime +totalTime minutes)
19
# 20 // Vehicle availability verification
# 21 availability =VehicleAvailabilityService.checkVehicleAvailability({
# 22 vehicleId,
# 23 shiftId,
# 24 proposedDate :newDate(date),
# 25 proposedStartTime : startTime ,
# 26 proposedEndTime :endTime,
# 27 })
# 28 abort400 with`availability.reason` whenconflicts detected (maintenance,
overlapping routes, etc.) ,→
29
# 30 // Employee + stop validation
# 31 employeeIds =dto.employees[].employeeId
# 32 stopIds =dto.employees[].stopId
# 33 availableEmployees =prisma.employee.findMany({
# 34 where:{id:{in: employeeIds },organizationId : activeOrgId ,assigned :
false}, ,→
# 35 })
# 36 abort400 ifcountsmismatch (someemployees already assigned)
# 37 existingStops =prisma.stop.findMany({
# 38 where:{
# 39 id:{in: stopIds },
# 40 organizationId : activeOrgId ,
# 41 employee :{id:{in: employeeIds },assigned : false},
105

# 42 routeId: null,
# 43 },
# 44 include:{employee : true},
# 45 })
# 46 abort400 ifstopsmissing oralready boundtoroutes
47
# 48 // Atomic persistence layer
# 49 transaction(prisma =>{
# 50 newRoute =prisma.route.create({
# 51 data:{
# 52 name,
# 53 vehicleId,
# 54 shiftId,
# 55 locationId,
# 56 date: newDate(date),
# 57 startTime,
# 58 endTime,
# 59 totalDistance,
# 60 totalTime,
# 61 status:'ACTIVE' ,
# 62 organizationId : activeOrgId ,
# 63 },
# 64 })
65
# 66 prisma.stop.updateMany({ where:{id:{in: stopIds }},data:{routeId:
newRoute.id ,estimatedArrivalTime : newDate()}}) ,→
# 67 prisma.employee.updateMany({ where:{id:{in:employeeIds }},data:{
assigned :true}}) ,→
68
# 69 vehicle =prisma.vehicle.findUnique({ where:{id: vehicleId }})
# 70 driverId =vehicle?.driverId ??prisma.driver.findFirst({
# 71 where:{
# 72 organizationId : activeOrgId ,
# 73 isActive :true,
# 74 vehicleAvailability :{
# 75 none:{shiftId, date: newDate(date), available :false}
# 76 }
# 77 }
# 78 })?.id
# 79 abort500 ifdriverId missing ->surfaces "No available drivers" error
80
# 81 prisma.vehicleAvailability.upsert({
# 82 where:{vehicleId_shiftId_date :{vehicleId, shiftId, date: newDate(date)
}}, ,→
# 83 create:{
# 84 vehicle:{connect:{id:vehicleId }},
# 85 shift:{connect:{id: shiftId }},
# 86 organization :{connect:{id:activeOrgId }},
106

# 87 driver:{connect:{id: driverId }},
# 88 date: newDate(date),
# 89 startTime,
# 90 endTime,
# 91 available : false,
# 92 },
# 93 update:{available : false},
# 94 })
# 95 })
96
# 97 return201 with`newRoute`
Notes on orchestration
•The handler assumes route-stop assignments originate from upstream clustering. When clients
need algorithmic assistance, they call the FastAPI microservice through the /fastapi proxy
prior to invoking this endpoint. The Express server itself does not currently invoke a Clus
teringOrches trator ; instead, it validates and persists the assignments it receives.
•Optimistic concurrency via a version column is not yet implemented. Transactions ensure
atomicity, and Prisma’s default isolation level protects against conflicting updates for the scope
of the transaction. Introducing versioned WHERE clauses would be the next step if multi-writer
conflicts become a concern.
•Driver assignment is automatic: if the selected vehicle lacks an attached driver, the handler
searches for an active driver without conflicting availability records. If none are free the
transaction aborts with a 500 (“No available drivers”).
### 4.2.2 Optimization Service Implementation (Python/FastAPI)
API Surface and Contract
The FastAPI app ( clustering/src/main.py ) exposes three routes: GET/health ,GET/(di-
agnostic), and POST/clustering . T o guard against overlapping solver runs, the module keeps
a module-level current_task and cancels any in-flight asyncio task before spawning a new one
for an incoming request. The clustering endpoint expects the body to match the RouteRequest
schema:
{
"locations": {
"HQ": [lat, lon],
"employees": [
{ "id": "emp-1", "latitude": <float>, "longitude": <float> },
107

...
]
},
"shuttles": [
{ "id": <int>, "capacity": <int> },
...
]
}
On success the endpoint returns:
{
"success": true,
"routes": [
{ "shuttle_id": <shuttleId>, "employees": [<employeeId>, ...]
},
...
],
"verification_passed": <bool>,
"total_demand": <int>,
"total_capacity": <int>
}
Eachemployees array is ordered according to the solver output. The microservice stops here;
it does not compute road-network geometry, distances, or ETAs. Those metrics are delegated
to the frontend Mapbox helpers described in §4.2.3.
Algorithm Identification
assign_routes.py constructs a vehicle routing problem (VRP) using Google OR- T ools . It
combines:
•A custom cost evaluator that blends haversine distance with a bearing-change penalty to dis-
courage sharp turns and long hops.
•Capacity constraints based on the shuttle capacities supplied in the payload (one passenger
demand per employee node).
•PATH_CHEAPEST_ARC for the initial solution, followed by GUIDED_LOCAL_SEARCH meta-
heuristics with a 30-second limit, a 500-solution cap, log_search telemetry, full propaga-
tion, and a guided-local-search lambda coeﬀicient of 0.5.
The solver works on a fully connected graph whose weights come from precomputed matrices:
•calculate_distance_and_bearing_matrix uses vectorized NumPy haversine calcula-
tions and bearing math to populate symmetric distance and directional grids for HQ + em-
108

ployees.
•The cost callback scales distance beyond 3–5 km, penalizes heading changes >120°, and re-
turns an integer cost ( distance_factor *1000+bearing_penalty *800 ).
Step-by-Step Logic The control flow inside assign_routes_endpoint orchestrates prepro-
cessing and solver invocation:
1process_request(payload):
# 2 hq=payload.locations .HQ
# 3 employees =payload.locations .employees
# 4 shuttle_capacities =[shuttle .capacity forshuttle inpayload.shuttles]
5
# 6 locations =[hq]+[[emp.latitude, emp .longitude] foremp inemployees]
# 7 distance_matrix, bearing_matrix =
calculate_distance_and_bearing_matrix(locations) ,→
8
# 9 routes=assign_employees_to_shuttles(locations, distance_matrix,
# 10 bearing_matrix, shuttle_capacities)
# 11 ifroutes is None:raise400"No solution found"
12
# 13 verification_passed =verify_unique_assignments(routes, len(employees))
14
# 15 mapped=[]
# 16 forshuttle_idx, route inenumerate (routes):
# 17 employee_indices =route[1:]# drop depot index 0
# 18 assigned =[employees[idx -1].id foridx inemployee_indices]
# 19 mapped.append({
# 20 "shuttle_id" : payload .shuttles[shuttle_idx] .id,
# 21 "employees" : assigned
# 22 })
23
# 24 return{
# 25 "success" : true,
# 26 "routes" : mapped,
# 27 "verification_passed" : verification_passed,
# 28 "total_demand" :len(employees),
# 29 "total_capacity" :sum(shuttle_capacities)
# 30 }
assign_employees_to_shuttles encapsulates the OR- T ools configuration:
# 1 manager =pywrapcp .RoutingIndexManager(num_locations, num_shuttles, 0)
# 2 routing =pywrapcp .RoutingModel(manager)
3
# 4 defcombined_cost_callback (from_index, to_index):
109

# 5 distance =distance_matrix[from_node][to_node]
# 6 bearing_change =...# derived from bearing_matrix and previous node
# 7 distance_factor =1.2 ifdistance >3 else1.0
# 8 ifdistance >5: distance_factor *=1.3
# 9 bearing_penalty =(bearing_change /180)*distance *0.8
# 10 ifbearing_change >120: bearing_penalty *=1.5
# 11 returnint(distance *distance_factor *1000+bearing_penalty *800)
12
# 13 routing.SetArcCostEvaluatorOfAllVehicles(
# 14 routing.RegisterTransitCallback(combined_cost_callback)
# 15 )
16
# 17 demand_callback_index =routing.RegisterUnaryTransitCallback(
# 18 lambdai: demand[manager .IndexToNode(i)]
# 19 )
# 20 routing.AddDimensionWithVehicleCapacity(
# 21 demand_callback_index, 0, shuttle_capacities, True,"Capacity"
# 22 )
23
# 24 search=pywrapcp .DefaultRoutingSearchParameters()
# 25 search.first_solution_strategy =PATH_CHEAPEST_ARC
# 26 search.local_search_metaheuristic =GUIDED_LOCAL_SEARCH
# 27 search.time_limit .FromSeconds( 30)
# 28 search.solution_limit =500
29
# 30 solution =routing.SolveWithParameters(search)
The helper verify_unique_assignments simply confirms that all employee nodes ( 1..N )
appear exactly once across the returned vehicle tours.
### 4.2.3 Frontend Application Implementation (React)
Architecture and State Management
The SP A under packages/client/src is composed in App.jsx , which layers providers for
theming, authentication, roles, organizations, and toasts ( ThemeProvider ,AuthProvider ,
RoleProvider ,OrganizationProvider ,ToastProvider ). Routing is handled by Re-
act Router, with AuthRoute andProtectedRoute wrappers enforcing Better Auth ses-
sions and role checks before rendering feature routes such as @pages/Route Management or
@pages/Shut tleManagement .
Server interactions flow through a single Axios instance ( services/api.js ) that injects Bet-
ter Auth cookies, handles 401 redirects, and exposes helper methods like getRoutes ,cre
ateRoute , andoptimizeClus ters . Rather than relying on T anStack Query or Zustand,
module-scoped service classes (for example, routeService.js ,shuttleService.js ) pro-
110

vide lightweight in-memory caching; debounced write logic is explicitly implemented where
needed (e.g., shuttleService.js ) and not universally applied. UI components then man-
age view state with React hooks ( useState ,useEffect ) and domain contexts. Authentica-
tion and tenant metadata come from custom contexts that wrap the Better Auth React client
(lib/auth -client.ts ), whileOrganizationContext/index.tsx enriches Better Auth or-
ganization hooks with additional loading/error state and helper actions (e.g., inviteMember ,
mapOrgError ). A lightweight toast context plus Sonner’s <Toaster /> surface global notifica-
tions, and useRouteOp timizer.js keeps a five-minute memoized cache of Mapbox responses
on the client.
Route Assignment Experience ( Route As sign ment flow)
The Route Assignment tab ( pages/Route Management/components/Route Assignmen
t/RouteAssignment.jsx ) operates as the route-assignment wizard described in the design
docs. The container component fetches shift options ( shiftService.getAllShifts() ),
hydrates routes on shift change ( routeService.getRoutesByShift() ), and hands both
datasets to its children. It orchestrates three coordinated components:
•Controls.jsx receives the pre-fetched shifts list from its parent, lets dispatchers search/fil-
ter the options, and optionally scopes by location via locationService.getLocations() ;
it does not fetch shifts itself or expose a separate route/time picker.
•DataSection.jsx reacts to those selections by fetching available employees via getUnas
signedEm ployeesByShift (REST call defined in services/api.js ), applying client-side
filtering/pagination, and presenting the assignment table. When the user selects an employee,
it opens the modal and passes the current route list.
•AssignmentModal.jsx handles the heavy lifting for previewing assignments. It invokes the
Mapbox-backed optimization helper ( services/routeOp timization.js ) to render a pro-
visional route on the map, computes metrics, and hands the confirmed assignment to its onAs
sign callback; DataSection.jsx owns the actual routeService.addEmployeeToRoute
mutation plus subsequent list refresh. Capacity guardrails ( route.stops.length <
route.shuttle.capacity ) and ID format validation (CUID regex checks) match backend
constraints. Upon success, the parent view patches local state so the updated route appears
immediately without a full refetch.
Elsewhere in Route Management, RouteManagementView/in dex.jsx pulls route, shuttle, de-
partment, and shift inventories in parallel (via cached service calls), applies search/filter logic,
and drives drawers or modals for inspection and editing. All of these components rely on the
same service layer and shared contexts for permissions.
111

Driver-Facing Surfaces (Current State)
Dispatcher and driver personas both land on the shuttle workspace, where the driver-facing dash-
board is implemented using ShuttleManagement/components/DriverStatus/index.jsx .
That module consumes driverService.getDrivers() to surface assigned route IDs, duty
state, and shift hours, giving drivers a consolidated manifest without exposing administrative
controls. The view is wrapped by the same AuthRoute /OrganizationGuard stack as manage-
ment pages, ensuring driver accounts only see their own organization’s data while keeping the
portal responsive on mobile devices.
Client-Side Route Optimization Heuristic
T wo cooperating modules deliver responsive route previews while the backend clustering service
runs:
•services/routeOp timization.js accepts{coordinates,areas}, calls Mapbox Di-
rections, and adjusts the returned duration to account for per-stop overhead before shipping
enriched metrics back to consumers like AssignmentModal.jsx .
•components/Common/Map/ser vices/routeOp timization.js focuses on rendering: it
builds an ordering via a nearest-neighbor heuristic, requests Mapbox geometry with expo-
nential backoff, and falls back to a deterministic HQ→Stops→HQ polyline if Mapbox is un-
reachable.
The shared hook useRouteOp timizer.js caches successful responses so repeat previews
reuse the same geometry within five minutes. The nearest-neighbor algorithm and fallback
logic mirror the source code:
1getInitialOrder(hqCoords, dropOffPoints) {
# 2 constvisited = newArray(dropOffPoints.length).fill( false);
# 3 constorder=[];
# 4 letcurrent =hqCoords;
# 5 while(order.length <dropOffPoints.length) {
# 6 constnextIndex =findNearestPoint(current, dropOffPoints, visited);
# 7 if(nextIndex ===-1) break;
8order.push(nextIndex);
9visited[nextIndex] =true;
# 10 current =dropOffPoints[nextIndex];
11}
# 12 returnorder;
13}
14
15optimizeRoute(coordinates, enableOptimization) {
16// guard against missing coords or invalid numbers → return fallback
# 17 consthq=coordinates[ 0];
# 18 constdropOffs =coordinates.slice( 1);
112

# 19 if(!MAPBOX_ACCESS_TOKEN ||!enableOptimization) returngetFallbackRoute(hq,
dropOffs); ,→
# 20 constorder=getInitialOrder(hq, dropOffs);
# 21 if(order.length ===0&&dropOffs.length >0) returngetFallbackRoute(hq,
dropOffs); ,→
# 22 constwaypoints =[hq,...reorder(dropOffs, order), hq];
# 23 consturl=buildMapboxDirectionsURL(waypoints);
# 24 constresponse =retryFetch(url); // 3 attempts, exponential backoff
# 25 if(!response.ok ||response.code !=='Ok') returngetFallbackRoute(hq, dropOffs);
# 26 constroute=response.routes[ 0];
# 27 return{
# 28 coordinates :route.geometry.coordinates,
# 29 waypoints :annotateWaypoints(hq, dropOffs, order),
# 30 dropOffOrder :order.map(i =>i+1),
# 31 distance :route.distance,
# 32 duration :route.duration,
# 33 optimized : true
34};
35}
36
37getFallbackRoute(hq, dropOffs) {
38// chain HQ → dropOffs → HQ
39// estimate distance/time with haversine + 40 km/h average speed
40// flag optimized: false so the UI can warn users
# 41 return{/* ... */ };
42}
While the rendering helper returns {coordinates,waypoints, distance,duration,
optimized}, the assignment helper packages its metrics under a metrics object ({to
talDistance,totalTime,rawData}). Callers normalize these differences— Assignment
Modal.jsx , for instance, recomputes haversine totals when Mapbox fails so the UI can still
surface distance/time estimates. The frontend therefore produces fast, local previews while de-
ferring canonical routing decisions to the backend OR- T ools service documented in § 4.2.2 .
4.3. Code for Major Functionalities (Annotated Snippets)
Backend Route Creation (Express + Prisma)
The create-route endpoint ( packages/server/s rc/routes/routes.ts ) demonstrates how
request scope, authorization, validation, and multi-table consistency are orchestrated inside
a single handler. The excerpt below preserves control-flow order while trimming validation
branches for brevity .
113

1router.post( '/',requireAuth, validateSchema(CreateRouteSchema, 'body'), async
(req,res)=>{ ,→
# 2 const{employees, ...payload }=req.body asCreateRouteInput;
# 3 constactiveOrgId =req.session ?.session ?.activeOrganizationId;
# 4 if(!activeOrgId) {
# 5 returnres.status( 400).json({ message:'Active organization not found' });
# 6 }
7
# 8 constpermissionCheck =awaitauth.api.hasPermission({
# 9 headers:awaitfromNodeHeaders(req.headers),
# 10 body:{permissions :{route:['create' ]}},
# 11 });
# 12 if(!permissionCheck.success) {
# 13 returnres.status( 403).json({ message:'Unauthorized' });
# 14 }
15
# 16 // …vehicle availability validation omitted…
# 17 constshift= awaitprisma.shift.findFirst({
# 18 where:{id: payload.shiftId ,organizationId : activeOrgId },
# 19 });
# 20 if(!shift){
# 21 returnres.status( 404).json({ error:'Shift not found.' });
# 22 }
23
# 24 conststartTime =shift.endTime;
# 25 constendTime =newDate(startTime.getTime() +(payload.totalTime ||0)*
60000); ,→
# 26 constemployeeIds =employees.map((employee) =>employee.employeeId);
# 27 conststopIds =employees.map((employee) =>employee.stopId);
28
# 29 awaitprisma.$transaction( async(tx)=>{
# 30 constnewRoute =awaittx.route.create({
# 31 data:{
# 32 ...payload,
# 33 date: newDate(payload.date),
# 34 organizationId : activeOrgId ,
# 35 },
# 36 });
37
# 38 awaittx.stop.updateMany({
# 39 where:{id:{in: stopIds }},
# 40 data:{routeId: newRoute.id ,estimatedArrivalTime : newDate()},
# 41 });
42
# 43 awaittx.employee.updateMany({
# 44 where:{id:{in: employeeIds }},
# 45 data:{assigned : true},
114

# 46 });
47
# 48 constvehicle = awaittx.vehicle.findUnique({ where:{id: payload.vehicleId
}}); ,→
# 49 letdriverId =vehicle?.driverId;
# 50 if(!driverId) {
# 51 constavailableDriver = awaittx.driver.findFirst({
# 52 where:{
# 53 organizationId :activeOrgId ,
# 54 isActive : true,
# 55 vehicleAvailability :{
# 56 none:{
# 57 shiftId: payload.shiftId ,
# 58 date: newDate(payload.date),
# 59 available : false,
# 60 },
# 61 },
# 62 },
# 63 });
# 64 if(!availableDriver) {
# 65 throw new Error('No available drivers found for this vehicle.' );
# 66 }
# 67 driverId =availableDriver.id;
# 68 }
69
# 70 awaittx.vehicleAvailability.upsert({
# 71 where:{
# 72 vehicleId_shiftId_date :{
# 73 vehicleId :payload.vehicleId ,
# 74 shiftId: payload.shiftId ,
# 75 date: newDate(payload.date),
# 76 },
# 77 },
# 78 create:{
# 79 vehicle:{connect:{id:payload.vehicleId }},
# 80 shift:{connect:{id: payload.shiftId }},
# 81 organization :{connect:{id:activeOrgId }},
# 82 driver:{connect:{id: driverId }},
# 83 date: newDate(payload.date),
# 84 startTime,
# 85 endTime,
# 86 available : false,
# 87 },
# 88 update:{available : false},
# 89 });
90
# 91 res.status( 201).json(newRoute);
# 92 });
115

# 93 });
This handler begins by enforcing Better Auth permissions, then uses a Prisma transaction so
route creation, stop assignment, employee status updates, and vehicle availability state changes
either succeed together or fail together; when the chosen vehicle lacks a driver , in-transaction
fallback logic selects an available driver or aborts with an error .
Tenant Context Hydration (Better Auth Middleware)
Organization-aware routes wrap their controllers with withOrganization (pack
ages/server/s rc/middleware/organization.ts ) so downstream handlers receive
tenant context without repeating boilerplate logic.
# 1 export function withOrganization(handler : Function ){
# 2 return async(req:Request,res: Response ,next: NextFunction )=>{
# 3 if(!req.user) {
# 4 returnres.status( 401).json({ error:'Authentication required' });
# 5 }
6
# 7 constorgs= awaitauth.api.listOrganizations({
# 8 headers: fromNodeHeaders (req.headers),
# 9 });
# 10 if(!orgs?.length) {
# 11 returnres.status( 403).json({ error:'No organization access' });
# 12 }
13
# 14 req.organizations =orgs;
# 15 req.activeOrganization =
# 16 orgs.find((org) =>org.id===req.session ?.activeOrganizationId) ||
orgs[0]; ,→
17
# 18 returnhandler(req, res,next);
# 19 };
# 20 }
The middleware raises clear 401/403 errors when session context is missing, then attaches
both the organization list and the active organization to the request so feature routes can trust
req.activeOrganization without repeating Better Auth calls.
OR‐Tools Heuristic (Python Clustering Service)
The FastAPI microservice ( clustering/src/assign_routes.py ) relies on a custom cost
callback that biases the solver toward short legs and smooth turns. The snippet highlights the
116

weighted penalties used when OR- T ools evaluates each hop in the tour.
# 1 defcombined_cost_callback (from_index: int, to_index: int)->int:
# 2 from_node =manager.IndexToNode(from_index)
# 3 to_node =manager.IndexToNode(to_index)
# 4 distance =distance_matrix[from_node][to_node]
5
# 6 bearing =bearing_matrix[from_node][to_node]
# 7 prev_bearing =0
# 8 iffrom_node !=0:
# 9 fori inrange(num_locations):
# 10 ifrouting.IsStart(manager .NodeToIndex(i)):
# 11 prev_bearing =bearing_matrix[i][from_node]
# 12 break
13
# 14 bearing_change =min((bearing -prev_bearing) %360, (prev_bearing -bearing)
%360) ,→
15
# 16 distance_factor =1.2 ifdistance >3 else1.0
# 17 ifdistance >5:
# 18 distance_factor *=1.3
19
# 20 bearing_penalty =(bearing_change /180.0)*distance *0.8
# 21 ifbearing_change >120:
# 22 bearing_penalty *=1.5
23
# 24 base_cost =distance *distance_factor *1000
# 25 returnint(base_cost +bearing_penalty *800)
Distance scaling discourages long detours, while the bearing penalty dampens zig-zag patterns.
The callback feeds OR-T ools’ GUIDED_LOCAL_SEARCH , producing balanced shuttle tours that
respect capacity constraints.
Route Assignment Modal (React Client)
On the client, AssignmentModal.jsx orchestrates the preview workflow . It validates the candi-
date employee, delegates geometry to Mapbox, and computes fallback metrics so the UI remains
responsive even when external services are slow .
1useEffect(() =>{
# 2 if(!show||!selectedRoute) return;
3
# 4 constcalculateOptimalRoute = async()=>{
# 5 setIsLoading( true);
# 6 try{
# 7 if(!employee.stopId ||!employee.stop) {
117

# 8 throw new Error("Employee must have a valid stop location" );
# 9 }
10
# 11 constallStops =[
# 12 ...selectedRoute.stops.map((stop) =>({
# 13 ...stop,
# 14 displayName :stop.employee
# 15 ?`${stop.employee.name }(${stop.employee.area })`
# 16 :stop.area,
# 17 })),
# 18 {
# 19 id:employee.stopId,
# 20 latitude :employee.stop.latitude,
# 21 longitude :employee.stop.longitude,
# 22 area:employee.area ||employee.location,
# 23 displayName :`${employee.name }(${employee.area ||
employee.location })`, ,→
# 24 isNew: true,
# 25 },
# 26 ];
27
# 28 constvalidStops =allStops.filter((stop) =>stop.latitude &&
stop.longitude); ,→
# 29 if(!validStops.length) {
# 30 throw new Error("No valid stops found" );
# 31 }
32
# 33 constoptimized = awaitoptimizeRoute({
# 34 coordinates :validStops.map((stop) =>[stop.longitude, stop.latitude]),
# 35 areas:validStops.map((stop) =>stop.displayName),
# 36 });
37
# 38 lettotalDistance =0;
# 39 for(leti=0;i<optimized.coordinates.length -1;i++){
# 40 const[lon1,lat1]=optimized.coordinates[i];
# 41 const[lon2,lat2]=optimized.coordinates[i +1];
# 42 constdLat=((lat2-lat1)*Math.PI)/180;
# 43 constdLon=((lon2-lon1)*Math.PI)/180;
# 44 consta=Math.sin(dLat /2)**2+
# 45 Math.cos((lat1 *Math.PI)/180)*
# 46 Math.cos((lat2 *Math.PI)/180)*
# 47 Math.sin(dLon /2)**2;
# 48 constc=2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
# 49 totalDistance +=6371*c;
# 50 }
51
# 52 constestimatedTime =Math.ceil((totalDistance /30)*60);
# 53 setRouteMetrics({
118

# 54 totalDistance :parseFloat (totalDistance.toFixed( 2)),
# 55 totalTime :estimatedTime,
# 56 });
57
# 58 setOptimizedRoute({
# 59 id:selectedRoute.id,
# 60 coordinates :optimized.coordinates,
# 61 areas:optimized.areas,
# 62 stops:validStops,
# 63 status:'preview' ,
# 64 });
# 65 } catch(error) {
# 66 toast.error( 'Failed to create route preview: ' +error.message);
# 67 } finally {
# 68 setIsLoading( false);
# 69 }
# 70 };
71
# 72 calculateOptimalRoute();
# 73 },[selectedRoute, show,employee]);
The effect-driven workflow keeps the modal responsive: data validation blocks invalid stops
early, Mapbox optimization runs asynchronously, and a haversine fallback ensures distance/-
time metrics are still available.
4.4. Testing Specification and Reports
### 4.4.1 Unit Testing
### 4.4.2 Integration Testing
### 4.4.3 End‐to‐End (E2E) Testing
### 4.4.4 Test Results Summary
119

# References
[1] F. Altıparmak and I. Kara, “Employee shuttle bus routing problem,” in Proc. 5th Int.
Conf. Ind. Eng. Oper. Manage. , Dubai, UAE, Mar. 2020. [Online]. A vailable: https:
//www.researchgate.net/publication/341726808_Employee_Shuttle_Bus_
Routing_Problem .
[2] M. M. A ydın, E. Sokolovskij, P . Jaskowski, and J. Matijošius, “Service management of
employee shuttle service under inhomogeneous fleet constraints using dynamic linear
programming: A case study,” Appl. Sci. , vol. 14, no. 9, p. 3604, 2024. [Online]. A vailable:
https://www.mdpi.com/2076-3417/15/9/4604 .
[3] V . Pillac, M. Gendreau, C. Guéret, and A. Medaglia, “ A review of dynamic vehicle rout-
ing problems,” European Journal of Operational Research , vol. 225, no. 1, pp. 1–11,
2013. [Online]. A vailable: https://hal.science/hal-00739779v1/document .
[4] Wikipedia, V ehicle routing problem , Jul. 2023. [Online]. A vailable: https://en.
wikipedia.org/wiki/Vehicle_routing_problem .
[5] Q. W ang and J. Holguín- V eras, “ A tour-based urban freight demand model using entropy
maximization,” in Presented at the 91st Annual Meeting of the T ransportation Research
Board , W ashington D.C., 2012. [Online]. A vailable: https://onlinepubs.trb.org/
onlinepubs/shrp2/c20/015atour-based.pdf .
[6] Aptean, Aptean Routing & Scheduling Case Study: George’s , Apr. 2021. [Online]. A vail-
able:https://www.aptean.com/en-US/insights/success-story/paragons-
software-helps-georges-deliver-fleet-and-fuel-savings .
[7] P . K. Akkah, E. K. K. Sakyi, and J. K. Panford, “Multi-tenancy in cloud native architec-
ture: A systematic mapping study,” in Proc. 2021 IEEE 14th Int. Conf. on Cloud Com-
puting (CLOUD) , 2021, pp. 248–252. [Online]. A vailable: https://pure.port.ac.
uk/ws/portalfiles/portal/70449994/Multi_tenancy_in_cloud_native_
architecture_PDF.pdf .
[8] G. Peker and D. Türsel Eliiyi, “Employee shuttle bus routing problem: A case study,”
Avrupa Bilim ve T eknoloji Dergisi , no. 46, pp. 151–160, 2023. [Online]. A vailable: https:
//dergipark.org.tr/en/download/article-file/2641311 .
120

[9] F. Jamshidi, C. Pahl, N. Cito, and N. Medvidovic, “Microservices: The journey so far and
challenges ahead,” IEEE Software , vol. 35, no. 3, pp. 24–35, May 2018. DOI: 10.1109/
MS.2018.2141039 . [Online]. A vailable: https://doi.org/10.1109/MS.2018.
# 2141039 .
[10] C. Lin, K. L. Choy, G. T . S. Ho, S. H. Chung, and H. Y . Lam, “Survey of green vehicle
routing problem: Past and future trends,” Expert Systems with Applications , vol. 41, no. 4,
pp. 1118–1138, 2014. DOI: 10.1016/j.eswa.2013.07.107 . [Online]. A vailable:
https://doi.org/10.1016/j.eswa.2013.07.107 .
[11] Ministry of Innovation and T echnology, Ethiopia, “Digital ethiopia 2025: A strategy for
ethiopia’s digital transformation,” Ministry of Innovation and T echnology, Addis Ababa,
Ethiopia, T ech. Rep., 2020. [Online]. A vailable: https://www.lawethiopia.com/
images/Policy_documents/Digital-Ethiopia-2025-Strategy-english.pdf .
[12] S. Erdoğan and E. Miller-Hooks, “ A green vehicle routing problem,” T ransportation Re-
search P art E: Logistics and T ransportation Review , vol. 48, no. 1, pp. 100–114, 2012.
DOI:10.1016/j.tre.2011.08.001 . [Online]. A vailable: https://hal.science/
hal-03182944v1/document .
[13] Y .-H. Chen, C.-Y . Chiu, and H.-M. T sai, Hub-based high-capacity shared mobility , 2020.
arXiv:2008.10855[cs.CY] .
[14] S. W ang, Z. Liu, Y . Y uan, and L. Y ang, “Joint optimization of mixed-integer program-
ming and reinforcement learning for dynamic vehicle routing of mixed-energy fleets un-
der emission constraints,” Sustainability , vol. 17, no. 10, 2024, ISSN: 2071-1050. [On-
line]. A vailable: https://www.mdpi.com/2071-1050/17/10/4707 .
[15] D. Ambrosino, A. R. Nodari, and V . D. Martinis, A continuous approximation model for
the design of a demand-adaptive transit system , 2021. arXiv: 2112.14748[math.OC] .
[16] J. Schasfoort, S. van der Zee, and S. Siero, “Flex-route control through reinforcement
learning,” ISPRS International Journal of Geo-Information , vol. 8, no. 5, 2024, ISSN:
2624-6511. [Online]. A vailable: https://www.mdpi.com/2624-6511/8/5/150 .
[17] M. Nicholas, “Centrally coordinated shared-ride shuttle scheduling at airports,” Ph.D.
dissertation, University of California, Berkeley, 2012. [Online]. A vailable: https://
escholarship.org/uc/item/6gg7r6c5 .
121

[18] Y . Gajpal, M. S. Al-Muraikhi, and A. S. Al-Muraikhi, “ A predictive fleet management
platform for logistics service providers,” Electronics , vol. 9, no. 6, 2020, ISSN: 2079-9292.
[Online]. A vailable: https://www.mdpi.com/2079-9292/9/6/1021 .
[19] S. Kumar, H. Zhu, T . S. Jayram, S. Jain, and X. Zhang, Anticipatory routing in dynamic
vehicle routing with stochastic customer requests , 2021. arXiv: 2106.14685[cs.LG] .
[20] Y . Agarwal, A. Siddiq, M. J. Z. Schäffner, and H. A. von der Gracht, Stochastic vehicle
routing with spatially correlated demands , 2023. arXiv: 2308.05507[cs.LG] .
[21] Y . Bai and S. Qian, Rider-centered solutions for ride-pooling with adaptive walk-distance
and stop-pooling , 2023. arXiv: 2306.13356[econ.GN] .
122

Appendix A – User Manual
123

Appendix B – Data Collection Methods and Tools
124

Milestones
125