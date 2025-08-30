import { auth } from '../lib/auth';

async function createUser(name: string, email: string, password: string) {
    const data = await auth.api.signUpEmail({
        body: {
            name: name, // required
            email: email, // required
            password: password, // required
        },
    });
    console.log(`Created user: ${name} (${email})`);
    return data;
}

const users = [
    // Super Admin
    {
        name: "System Administrator",
        email: "superadmin@fleetmanager.com",
        password: "SuperAdmin123!"
    },
    
    // Fleet Owners
    {
        name: "Robert Sterling",
        email: "robert.sterling@fleetmanager.com",
        password: "Owner123!"
    },
    {
        name: "Victoria Hamilton",
        email: "victoria.hamilton@fleetmanager.com",
        password: "Owner123!"
    },
    {
        name: "Marcus Blackstone",
        email: "marcus.blackstone@fleetmanager.com",
        password: "Owner123!"
    },
    {
        name: "Elena Rosewood",
        email: "elena.rosewood@fleetmanager.com",
        password: "Owner123!"
    },
    {
        name: "Jonathan Maxwell",
        email: "jonathan.maxwell@fleetmanager.com",
        password: "Owner123!"
    },
    
    // Fleet Admins
    {
        name: "John Mitchell",
        email: "john.mitchell@fleetmanager.com",
        password: "AdminFleet123!"
    },
    {
        name: "Sarah Thompson",
        email: "sarah.thompson@fleetmanager.com", 
        password: "AdminFleet123!"
    },
    {
        name: "Kevin Martinez",
        email: "kevin.martinez@fleetmanager.com",
        password: "AdminFleet123!"
    },
    {
        name: "Nicole Johnson",
        email: "nicole.johnson@fleetmanager.com",
        password: "AdminFleet123!"
    },
    {
        name: "Brian Wilson",
        email: "brian.wilson@fleetmanager.com",
        password: "AdminFleet123!"
    },
    {
        name: "Catherine Moore",
        email: "catherine.moore@fleetmanager.com",
        password: "AdminFleet123!"
    },
    {
        name: "Gregory Evans",
        email: "gregory.evans@fleetmanager.com",
        password: "AdminFleet123!"
    },
    
    // Fleet Managers
    {
        name: "Mike Rodriguez",
        email: "mike.rodriguez@fleetmanager.com",
        password: "Manager123!"
    },
    {
        name: "Emily Chen",
        email: "emily.chen@fleetmanager.com",
        password: "Manager123!"
    },
    {
        name: "David Wilson",
        email: "david.wilson@fleetmanager.com",
        password: "Manager123!"
    },
    {
        name: "Lisa Park",
        email: "lisa.park@fleetmanager.com",
        password: "Manager123!"
    },
    
    // Drivers
    {
        name: "Robert Johnson",
        email: "robert.johnson@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Maria Garcia",
        email: "maria.garcia@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "James Brown",
        email: "james.brown@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Jennifer Davis",
        email: "jennifer.davis@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Michael Lee",
        email: "michael.lee@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Amanda Williams",
        email: "amanda.williams@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Christopher Taylor",
        email: "christopher.taylor@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Jessica Martinez",
        email: "jessica.martinez@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Daniel Anderson",
        email: "daniel.anderson@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Ashley White",
        email: "ashley.white@fleetmanager.com",
        password: "Driver123!"
    },
    
    // Additional Fleet Admins
    {
        name: "Kevin Martinez",
        email: "kevin.martinez@fleetmanager.com",
        password: "AdminFleet123!"
    },
    {
        name: "Nicole Johnson",
        email: "nicole.johnson@fleetmanager.com",
        password: "AdminFleet123!"
    },
    {
        name: "Brian Wilson",
        email: "brian.wilson@fleetmanager.com",
        password: "AdminFleet123!"
    },
    
    // Additional Fleet Managers
    {
        name: "Angela Davis",
        email: "angela.davis@fleetmanager.com",
        password: "Manager123!"
    },
    {
        name: "Steven Clark",
        email: "steven.clark@fleetmanager.com",
        password: "Manager123!"
    },
    {
        name: "Patricia Lewis",
        email: "patricia.lewis@fleetmanager.com",
        password: "Manager123!"
    },
    {
        name: "Mark Taylor",
        email: "mark.taylor@fleetmanager.com",
        password: "Manager123!"
    },
    {
        name: "Linda Rodriguez",
        email: "linda.rodriguez@fleetmanager.com",
        password: "Manager123!"
    },
    {
        name: "Paul Anderson",
        email: "paul.anderson@fleetmanager.com",
        password: "Manager123!"
    },
    
    // Additional Drivers
    {
        name: "Carlos Hernandez",
        email: "carlos.hernandez@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Monica Silva",
        email: "monica.silva@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Frank Thompson",
        email: "frank.thompson@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Rebecca Lopez",
        email: "rebecca.lopez@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Gregory Miller",
        email: "gregory.miller@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Carmen Gonzalez",
        email: "carmen.gonzalez@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Andrew Scott",
        email: "andrew.scott@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Stephanie Young",
        email: "stephanie.young@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Victor Perez",
        email: "victor.perez@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Melissa King",
        email: "melissa.king@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Ryan Wright",
        email: "ryan.wright@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Diana Torres",
        email: "diana.torres@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Jonathan Rivera",
        email: "jonathan.rivera@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Helen Cooper",
        email: "helen.cooper@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Raymond Reed",
        email: "raymond.reed@fleetmanager.com",
        password: "Driver123!"
    },
    {
        name: "Brenda Murphy",
        email: "brenda.murphy@fleetmanager.com",
        password: "Driver123!"
    },
    
    // Maintenance Staff
    {
        name: "Tony Ricci",
        email: "tony.ricci@fleetmanager.com",
        password: "Maintenance123!"
    },
    {
        name: "Sandra Bell",
        email: "sandra.bell@fleetmanager.com",
        password: "Maintenance123!"
    },
    {
        name: "George Barnes",
        email: "george.barnes@fleetmanager.com",
        password: "Maintenance123!"
    },
    {
        name: "Julia Foster",
        email: "julia.foster@fleetmanager.com",
        password: "Maintenance123!"
    },
    
    // Dispatchers
    {
        name: "Karen Hughes",
        email: "karen.hughes@fleetmanager.com",
        password: "Dispatch123!"
    },
    {
        name: "Eric Powell",
        email: "eric.powell@fleetmanager.com",
        password: "Dispatch123!"
    },
    {
        name: "Nancy Russell",
        email: "nancy.russell@fleetmanager.com",
        password: "Dispatch123!"
    },
    {
        name: "Alan Griffin",
        email: "alan.griffin@fleetmanager.com",
        password: "Dispatch123!"
    },
    
    // Regular Employees - Operations
    {
        name: "Emma Rodriguez",
        email: "emma.rodriguez@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Jacob Miller",
        email: "jacob.miller@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Olivia Johnson",
        email: "olivia.johnson@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Noah Wilson",
        email: "noah.wilson@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Ava Brown",
        email: "ava.brown@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Liam Davis",
        email: "liam.davis@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Isabella Garcia",
        email: "isabella.garcia@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "William Martinez",
        email: "william.martinez@fleetmanager.com",
        password: "User123!"
    },
    
    // Regular Employees - Customer Service
    {
        name: "Sophia Anderson",
        email: "sophia.anderson@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Mason Thompson",
        email: "mason.thompson@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Charlotte White",
        email: "charlotte.white@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Ethan Moore",
        email: "ethan.moore@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Amelia Jackson",
        email: "amelia.jackson@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Alexander Martin",
        email: "alexander.martin@fleetmanager.com",
        password: "User123!"
    },
    
    // Regular Employees - HR/Admin
    {
        name: "Harper Lee",
        email: "harper.lee@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Benjamin Perez",
        email: "benjamin.perez@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Evelyn Thompson",
        email: "evelyn.thompson@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Lucas Harris",
        email: "lucas.harris@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Abigail Clark",
        email: "abigail.clark@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Henry Lewis",
        email: "henry.lewis@fleetmanager.com",
        password: "User123!"
    },
    
    // Regular Employees - Finance
    {
        name: "Madison Walker",
        email: "madison.walker@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Owen Hall",
        email: "owen.hall@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Ella Allen",
        email: "ella.allen@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Sebastian Young",
        email: "sebastian.young@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Scarlett Hernandez",
        email: "scarlett.hernandez@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Jack King",
        email: "jack.king@fleetmanager.com",
        password: "User123!"
    },
    
    // Regular Employees - IT Support
    {
        name: "Grace Wright",
        email: "grace.wright@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Leo Lopez",
        email: "leo.lopez@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Chloe Hill",
        email: "chloe.hill@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Daniel Scott",
        email: "daniel.scott@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Victoria Green",
        email: "victoria.green@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Matthew Adams",
        email: "matthew.adams@fleetmanager.com",
        password: "User123!"
    },
    
    // Regular Employees - Safety & Compliance
    {
        name: "Zoe Baker",
        email: "zoe.baker@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Carter Gonzalez",
        email: "carter.gonzalez@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Lily Nelson",
        email: "lily.nelson@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Wyatt Carter",
        email: "wyatt.carter@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Natalie Mitchell",
        email: "natalie.mitchell@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Grayson Perez",
        email: "grayson.perez@fleetmanager.com",
        password: "User123!"
    },
    
    // Regular Employees - Training & Development
    {
        name: "Hannah Roberts",
        email: "hannah.roberts@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Luke Turner",
        email: "luke.turner@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Addison Phillips",
        email: "addison.phillips@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Julian Campbell",
        email: "julian.campbell@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Nora Parker",
        email: "nora.parker@fleetmanager.com",
        password: "User123!"
    },
    {
        name: "Isaiah Evans",
        email: "isaiah.evans@fleetmanager.com",
        password: "User123!"
    },
    
    // Employee Role Specific Users
    {
        name: "Tyler Brooks",
        email: "tyler.brooks@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Ashley Coleman",
        email: "ashley.coleman@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Jordan Walsh",
        email: "jordan.walsh@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Morgan Price",
        email: "morgan.price@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Casey Reed",
        email: "casey.reed@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Taylor Brooks",
        email: "taylor.brooks@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Riley Spencer",
        email: "riley.spencer@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Cameron Ward",
        email: "cameron.ward@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Avery Morgan",
        email: "avery.morgan@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Quinn Foster",
        email: "quinn.foster@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Drew Patterson",
        email: "drew.patterson@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Sage Mitchell",
        email: "sage.mitchell@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "River Stone",
        email: "river.stone@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Phoenix Gray",
        email: "phoenix.gray@fleetmanager.com",
        password: "Employee123!"
    },
    {
        name: "Rowan Bell",
        email: "rowan.bell@fleetmanager.com",
        password: "Employee123!"
    },
    
    // Additional test users
    {
        name: "Thomas Moore",
        email: "thomas.moore@fleetmanager.com",
        password: "TestUser123!"
    },
    {
        name: "Rachel Green",
        email: "rachel.green@fleetmanager.com",
        password: "TestUser123!"
    },
    {
        name: "Alex Chen",
        email: "alex.chen@fleetmanager.com",
        password: "TestUser123!"
    },
    {
        name: "Sophie Williams",
        email: "sophie.williams@fleetmanager.com",
        password: "TestUser123!"
    },
    {
        name: "Marcus Jones",
        email: "marcus.jones@fleetmanager.com",
        password: "TestUser123!"
    }
];

async function createAllUsers() {
    console.log("Starting user creation process...");
    
    for (const user of users) {
        try {
            await createUser(user.name, user.email, user.password);
        } catch (error) {
            console.error(`Failed to create user ${user.name} (${user.email}):`, error);
        }
    }
    
    console.log("User creation process completed!");
}

// Execute the script
createAllUsers().catch(console.error); 