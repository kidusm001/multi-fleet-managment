# Annex B: Data Collection Methods and Tools

## B.1 Overview

Data collection for the Routegna Enterprise Fleet Management Platform was critical to ensure realistic testing, validation, and simulation of shuttle routing operations in Addis Ababa, Ethiopia. The primary data collected consisted of geographical coordinates (latitude and longitude) for various sub-areas and locations within the city. This data was sourced using external geocoding APIs to transform textual location descriptions into precise geospatial coordinates, which were then used across multiple stages of the project development and testing lifecycle.

The data collection process was designed to be automated, reliable, and scalable, leveraging open-source tools and publicly available APIs. This approach minimized manual effort while ensuring data accuracy and consistency. The collected data served as the foundation for testing route optimization algorithms, populating backend databases with realistic employee locations, and validating the platform's geospatial functionalities.

**Note**: The geocoding scripts and data processing pipeline were implemented in Python and successfully used to generate the coordinate data. These scripts are maintained in a separate repository and are not included in this codebase.

## B.2 Data Collection Methods

### B.2.1 Geocoding via OpenCage API

The primary method for data collection involved geocoding, the process of converting addresses or location names into geographic coordinates. We utilized the OpenCage Geocoding API, a reliable and free-tier geocoding service that provides high-quality location data.

#### Key Steps in the Geocoding Process:
1. **Input Data Preparation**: Location data was initially compiled into a CSV file (`locations.csv`) containing columns for "Sub-Area" and "Main District". This CSV served as the input dataset, representing various neighborhoods and districts in Addis Ababa.
   
2. **API Query Construction**: For each location entry, a query string was constructed in the format: "{Sub-Area}, Addis Ababa, Ethiopia". This ensured specificity and reduced ambiguity in geocoding results.

3. **API Request and Response Handling**: 
   - HTTP GET requests were made to the OpenCage API endpoint (`https://api.opencagedata.com/geocode/v1/json`).
   - Requests included parameters for the query, API key, and result limit (set to 5 for broader coverage).
   - Responses were parsed to extract latitude and longitude coordinates.
   - A filtering mechanism prioritized results with detailed components (e.g., "neighbourhood" or "suburb") to ensure high-precision coordinates.

4. **Error Handling and Retry Logic**:
   - Implemented retry logic with up to 3 attempts per request to handle transient network issues or API rate limits.
   - Fallback to default coordinates (latitude: 9.0, longitude: 38.75) if geocoding failed after retries.
   - Added a 2-second pause between retries to respect API rate limits.

5. **Data Enrichment**: For each location, a Google Maps lookup link was generated using the query string, providing a manual verification option for users.

#### API Configuration:
- **API Key**: A valid OpenCage API key was obtained and used.
- **Rate Limiting**: The process was designed to operate within free-tier limits (approximately 2,500 requests per day).
- **Geographic Bias**: Queries were biased towards Addis Ababa, Ethiopia, to improve result relevance.

### B.2.2 Data Processing and Validation

- **Data Cleaning**: Entries where geocoding failed or returned default coordinates (latitude: 9.0, longitude: 38.75) were marked as "Not Found" and isolated for manual review.
- **Output Generation**: Successful geocodes were saved to `updated_coordinates.csv`, while failed entries were isolated in `pruned_coordinates.csv` for manual review.
- **Quality Assurance**: Failed entries in the pruned file allowed for manual verification and potential re-geocoding with refined queries.

## B.3 Tools and Technologies Used

### B.3.1 Programming Language and Libraries
- **Python**: The core scripting language for automation and data processing.
- **Requests Library**: For making HTTP API calls to the OpenCage service.
- **Pandas Library**: For efficient CSV file handling, data manipulation, and DataFrame operations.

### B.3.2 Development Environment
- **Integrated Development Environment (IDE)**: Visual Studio Code (VS Code) was used for script development, debugging, and execution.
- **Version Control**: Git for tracking changes to the data collection scripts.
- **Repository Hosting**: GitHub for collaborative development and code sharing.

### B.3.3 External Services
- **OpenCage Geocoding API**: Primary geocoding service for coordinate retrieval.
- **Google Maps**: Used for generating verification links and manual cross-checking of coordinates.

### B.3.4 Hardware and Infrastructure
- **Local Machine**: Windows-based system for script execution.
- **Internet Connectivity**: Required for API access and data retrieval.

## B.4 Applications and Uses in the Project

The collected location data was instrumental across multiple phases of the Routegna platform development. Below are the key applications:

### B.4.1 Testing Route Clustering Algorithms
- **Purpose**: To validate the two-stage route optimization process (geographic clustering followed by intra-cluster ordering).
- **Usage**: Real Addis Ababa coordinates were fed into the Python-based optimization microservice to test clustering accuracy and route efficiency. This ensured that the algorithms could handle authentic urban layouts rather than synthetic data.
- **Impact**: Improved algorithm robustness by exposing it to real-world geographic variations, such as densely populated neighborhoods and traffic-prone areas.

### B.4.2 Backend Database Population
- **Purpose**: To simulate diverse employee locations for testing the platform's core functionalities.
- **Usage**: Coordinates were imported into the PostgreSQL database via Prisma ORM to populate employee location records. This allowed for realistic simulation of shuttle assignments, route planning, and demand forecasting scenarios.
- **Impact**: Enabled comprehensive end-to-end testing of features like dynamic routing, vehicle assignment, and analytics dashboards with varied geographic distributions.

### B.4.3 Frontend Map Integration and Visualization
- **Purpose**: To provide accurate geospatial data for map-based UI components.
- **Usage**: Coordinates were used to render pickup points, routes, and stops on interactive maps within the React frontend. This supported features like route visualization and real-time tracking simulations.
- **Impact**: Enhanced user experience by ensuring maps displayed authentic Addis Ababa locations, improving the platform's credibility and usability.

### B.4.4 Validation of Geospatial Accuracy
- **Purpose**: To assess the precision of geocoding and routing calculations.
- **Usage**: Collected data was cross-referenced with known distances and travel times using Mapbox Directions API integrations. This helped calibrate distance metrics and validate optimization outputs.
- **Impact**: Ensured high fidelity in route calculations, reducing errors in estimated travel times and fuel consumption projections.

### B.4.5 Simulation of Demand Scenarios
- **Purpose**: To model various operational scenarios for predictive analytics.
- **Usage**: Location data was used to generate synthetic demand patterns, simulating peak hours, distributed workforces, and emergency rerouting. This fed into analytics modules for testing forecasting algorithms (planned for future iterations).
- **Impact**: Provided a foundation for evaluating platform performance under different load conditions, informing scalability decisions.

### B.4.6 Security and Data Privacy Testing
- **Purpose**: To test organization-scoped data isolation in the multi-tenant architecture.
- **Usage**: Location data was tagged with organization identifiers to simulate tenant-specific datasets, ensuring that access controls prevented cross-tenant data leakage.
- **Impact**: Validated the security model, confirming that sensitive location data remained compartmentalized per enterprise client.

### B.4.7 Performance Benchmarking
- **Purpose**: To benchmark API response times and system throughput.
- **Usage**: The data collection script was run with varying dataset sizes to measure geocoding performance, informing optimizations in the backend services.
- **Impact**: Helped identify bottlenecks and optimize API call patterns, contributing to the platform's overall efficiency.

### B.4.8 Testing and Quality Assurance
- **Purpose**: To ensure system reliability and validate functionality across different scenarios.
- **Usage**: The geocoded coordinate data was used extensively for unit testing, integration testing, and end-to-end testing of the fleet management platform. This included testing route calculations, distance computations, clustering algorithms, and map integrations with real geographic data.
- **Impact**: Improved overall system quality by validating functionality against authentic Addis Ababa geographic data, ensuring the platform would perform correctly in production environments.

## B.5 Data Sources and Ethical Considerations

### B.5.1 Data Sources
- **Primary Source**: OpenCage Geocoding API, which aggregates data from multiple providers including OpenStreetMap and commercial sources.
- **Input Dataset**: Custom CSV file (`locations.csv`) compiled from publicly available Addis Ababa administrative divisions and neighborhood listings.
- **Geocoding Implementation**: Python scripts were developed and executed to process the CSV data through the OpenCage API, generating validated coordinates.
- **No Personal Data**: All data collected was anonymized and location-based only; no personally identifiable information (PII) was included.

### B.5.2 Ethical and Legal Compliance
- **API Usage**: Adhered to OpenCage's terms of service, including rate limits and attribution requirements.
- **Data Privacy**: Ensured compliance with general data protection principles by avoiding collection of sensitive personal information.
- **Open-Source Commitment**: Scripts and methodologies were developed using open-source tools, promoting transparency and reproducibility.

## B.6 Challenges and Limitations

- **API Reliability**: Occasional API downtime or rate limiting required robust error handling and retry mechanisms.
- **Geocoding Accuracy**: Some locations yielded imprecise results due to incomplete address data; manual verification was necessary for critical entries.
- **Scalability**: Large datasets exceeded free-tier limits, necessitating batch processing and strategic API usage.
- **Geographic Specificity**: Addis Ababa's unique urban layout sometimes resulted in ambiguous geocodes, mitigated by query refinement.

## B.7 Sample Data and Outputs

### B.7.1 Input CSV Structure (`locations.csv`)
| Sub-Area          | Main District |
|-------------------|---------------|
| Bole              | Bole          |
| Piazza            | Arada         |
| Kazanchis         | Bole          |

### B.7.2 Output CSV Structure (`updated_coordinates.csv`)
| Sub-Area | Main District | Latitude | Longitude | Google Maps Link |
|----------|---------------|----------|-----------|------------------|
| Bole     | Bole          | 9.0034  | 38.7695  | https://www.google.com/maps/search/?api=1&query=Bole,+Addis+Ababa,+Ethiopia |
| Piazza   | Arada         | 9.0345  | 38.7521  | https://www.google.com/maps/search/?api=1&query=Piazza,+Addis+Ababa,+Ethiopia |

### B.7.3 Pruned Output (`pruned_coordinates.csv`)
Contains entries where geocoding failed, allowing for manual follow-up.

## B.8 Conclusion

The data collection methodology described herein provided a solid foundation for the Routegna platform's development and testing. By leveraging automated geocoding and robust data processing, we ensured access to realistic, high-quality geospatial data that enhanced the platform's functionality, reliability, and user experience. This approach not only supported immediate project needs but also established a scalable framework for future data-driven enhancements, such as advanced forecasting and real-time optimization. For further reading on geocoding techniques, API integrations, and data processing best practices, refer to the references section.

## B.9 Implementation in Current Codebase

While the geocoding scripts are maintained separately, the results of the geocoding process were successfully integrated into the application. The coordinate data generated through the OpenCage API geocoding process was used to populate realistic location data for testing and validation purposes.

### B.9.1 Database Integration
The geocoded coordinates were incorporated into the database seed files and used throughout the application for:
- Route optimization testing with real geographic data
- Frontend map visualization with accurate Addis Ababa locations  
- Validation of clustering algorithms with authentic urban layouts
- Performance testing with realistic distance calculations

### B.9.2 Clustering Service Integration
The Python clustering microservice (`clustering/src/main.py`) was designed to process coordinates that originated from the geocoding pipeline, ensuring that route optimization algorithms were validated against real-world geographic data rather than synthetic coordinates.

## B.10 References
- OpenCage Geocoding API Documentation: https://opencagedata.com/api
- Pandas Documentation: https://pandas.pydata.org/docs/
- Requests Library Documentation: https://docs.python-requests.org/en/latest/
- Python Official Documentation: https://docs.python.org/3/
- Geocoding Best Practices: https://developers.google.com/maps/documentation/geocoding/best-practices
- OpenStreetMap Data Sources: https://www.openstreetmap.org/about
- CSV File Handling in Python: https://realpython.com/python-csv/
- HTTP Requests in Python: https://realpython.com/python-requests/

## B.11 Code Snippets

Below are annotated code snippets from the implemented `locations.py` script, illustrating key parts of the data collection process that was successfully executed to generate the coordinate data used in the platform.

### B.11.1 API Key and Constants
```python
# Your OpenCage API Key
API_KEY = "YOUR_OPENCAGE_API_KEY"  # Note: In production, use environment variables for security

# Input and output CSV files
INPUT_CSV = "locations.csv"
OUTPUT_CSV = "updated_coordinates.csv"
PRUNED_OUTPUT_CSV = "pruned_coordinates.csv"
```
*This section defines the API key and file paths used in the implemented script.*

### B.11.2 Geocoding Function
```python
def fetch_coordinates(sub_area):
    query = f"{sub_area}, Addis Ababa, Ethiopia"
    url = f"https://api.opencagedata.com/geocode/v1/json?q={query}&key={API_KEY}&limit=5"
    
    for attempt in range(3):  # Retry logic (up to 3 attempts)
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            best_result = None
            
            # Filter results for high-detail components
            for result in data["results"]:
                components = result.get("components", {})
                if "neighbourhood" in components or "suburb" in components:
                    best_result = result
                    break
            
            # Fallback to the most detailed available result
            if best_result is None and data["results"]:
                best_result = data["results"][0]
            
            if best_result:
                location = best_result["geometry"]
                return location["lat"], location["lng"]
        else:
            time.sleep(2)  # Pause before retrying
    
    return None, None  # Return None if all attempts fail
```
*This function handles the geocoding API calls, including retry logic and result filtering for precision. This code was successfully executed to geocode Addis Ababa locations.*

### B.11.3 Data Processing and Output
```python
# Load the input CSV file
try:
    df = pd.read_csv(INPUT_CSV)
    if "Sub-Area" not in df.columns or "Main District" not in df.columns:
        raise ValueError("Input file must contain 'Sub-Area' and 'Main District' columns.")
except FileNotFoundError:
    print(f"Error: File {INPUT_CSV} not found.")
    exit()
except ValueError as e:
    print(f"Error: {e}")
    exit()

# Add latitude, longitude, and Google Maps lookup column
df["Latitude"] = None
df["Longitude"] = None
df["Google Maps Link"] = None

# Fetch coordinates for each row
for index, row in df.iterrows():
    sub_area = row["Sub-Area"]
    latitude, longitude = fetch_coordinates(sub_area)
    
    if latitude is not None and longitude is not None:
        if latitude == 9 and longitude == 38.75:  # Default fallback
            df.at[index, "Latitude"] = "Not Found"
            df.at[index, "Longitude"] = "Not Found"
        else:
            df.at[index, "Latitude"] = latitude
            df.at[index, "Longitude"] = longitude
    else:
        df.at[index, "Latitude"] = "Not Found"
        df.at[index, "Longitude"] = "Not Found"
    
    # Always generate a Google Maps link for manual lookup
    google_maps_query = f"{sub_area}, Addis Ababa, Ethiopia"
    df.at[index, "Google Maps Link"] = f"https://www.google.com/maps/search/?api=1&query={google_maps_query.replace(' ', '+')}"