# Move to src directory
Set-Location src

# Create base directory structure
New-Item -ItemType Directory -Force -Path @(
    # Pages with their components
    "src/pages/Dashboard/components",
    "src/pages/RouteManagement/components",
    "src/pages/EmployeeManagement/components",
    "src/pages/DriverManagement/components",
    "src/pages/ShuttleManagement/components",
    "src/pages/Payroll/components",
    "src/pages/Home/components",
    "src/pages/About/components",

    # Common components structure
    "src/components/Common/Layout/Header",
    "src/components/Common/Layout/Footer",
    "src/components/Common/Layout/Sidebar",
    "src/components/Common/Layout/TopBar",
    "src/components/Common/UI",
    "src/components/Common/Map",

    # Other directories
    "src/contexts",
    "src/data/types",
    "src/data/constants",
    "src/utils/api",
    "src/utils/helpers",
    "src/styles/theme"
)

# Move page components
# RouteManagement
Move-Item -Path "src/components/RouteAssignment/*" -Destination "src/pages/RouteManagement/components/" -Force
Move-Item -Path "src/components/RouteManagement/*" -Destination "src/pages/RouteManagement/components/" -Force

# Dashboard
Move-Item -Path "src/components/Dashboard/*" -Destination "src/pages/Dashboard/components/" -Force

# Driver Management
Move-Item -Path "src/components/DriverManagement/*" -Destination "src/pages/DriverManagement/components/" -Force

# Payroll
Move-Item -Path "src/components/Payroll/*" -Destination "src/pages/Payroll/components/" -Force

# Shuttle Management
Move-Item -Path "src/components/Shuttle/*" -Destination "src/pages/ShuttleManagement/components/" -Force

# Move layout components
Move-Item -Path "src/components/Header/*" -Destination "src/components/Common/Layout/Header/" -Force
Move-Item -Path "src/components/Footer/*" -Destination "src/components/Common/Layout/Footer/" -Force
Move-Item -Path "src/components/Sidebar/*" -Destination "src/components/Common/Layout/Sidebar/" -Force
Move-Item -Path "src/components/TopBar/*" -Destination "src/components/Common/Layout/TopBar/" -Force

# Move common components
Move-Item -Path "src/components/Map/*" -Destination "src/components/Common/Map/" -Force
Move-Item -Path "src/components/ui/*" -Destination "src/components/Common/UI/" -Force

# Move page files to their directories
Move-Item -Path "src/pages/RouteAssignment.jsx" -Destination "src/pages/RouteManagement/" -Force
Move-Item -Path "src/pages/DriverManagement.jsx" -Destination "src/pages/DriverManagement/" -Force
Move-Item -Path "src/pages/Payroll.jsx" -Destination "src/pages/Payroll/" -Force
Move-Item -Path "src/pages/EmployeeManagement.jsx" -Destination "src/pages/EmployeeManagement/" -Force
Move-Item -Path "src/pages/ShuttleManagement.jsx" -Destination "src/pages/ShuttleManagement/" -Force
Move-Item -Path "src/pages/Home.jsx" -Destination "src/pages/Home/" -Force
Move-Item -Path "src/pages/About.jsx" -Destination "src/pages/About/" -Force

# Move CSS files
Move-Item -Path "src/pages/Home.css" -Destination "src/pages/Home/" -Force
Move-Item -Path "src/pages/About.css" -Destination "src/pages/About/" -Force

# Clean up empty directories
$dirsToRemove = @(
    "src/components/RouteAssignment",
    "src/components/RouteManagement",
    "src/components/Dashboard",
    "src/components/DriverManagement",
    "src/components/Payroll",
    "src/components/Shuttle",
    "src/components/Header",
    "src/components/Footer",
    "src/components/Sidebar",
    "src/components/TopBar",
    "src/components/Map",
    "src/components/ui"
)

foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
        Remove-Item -Path $dir -Force -Recurse
    }
}

# Rename files for consistency
Rename-Item -Path "src/pages/RouteManagement/RouteAssignment.jsx" -NewName "index.jsx" -Force
foreach ($dir in Get-ChildItem -Path "src/pages" -Directory) {
    $mainFile = Get-ChildItem -Path $dir.FullName -Filter "*.jsx" | Where-Object { $_.Name -ne "index.jsx" } | Select-Object -First 1
    if ($mainFile) {
        Rename-Item -Path $mainFile.FullName -NewName "index.jsx" -Force
    }
} 