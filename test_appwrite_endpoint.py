
import requests
import sys

# Redirect stdout to a file with UTF-8 encoding
sys.stdout = open("appwrite_result.txt", "w", encoding="utf-8")

project_id = "6931c2ab002be1b72bb5"
endpoints = [
    "https://cloud.appwrite.io/v1",
    "https://sgp.cloud.appwrite.io/v1"
]

print(f"Testing Project ID: {project_id}")

for endpoint in endpoints:
    url = f"{endpoint}/account"
    headers = {
        "X-Appwrite-Project": project_id,
        "Content-Type": "application/json"
    }
    
    print(f"\n----------------------------------------")
    print(f"Testing Endpoint: {endpoint}")
    print(f"----------------------------------------")
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        try:
            print(f"Response JSON: {response.json()}")
        except:
            print(f"Response Text: {response.text}")
            
        if response.status_code == 401:
            print(f"SUCCESS: Project found! (401 is expected for unauthenticated request)")
        elif response.status_code == 404:
             print(f"FAILURE: Project/Endpoint not found (404)")
        elif response.status_code == 400:
             print(f"FAILURE: Bad Request (400) - Invalid Project or Parameters")
        else:
             print(f"UNEXPECTED: Status {response.status_code}")
             
    except Exception as e:
        print(f"ERROR: {str(e)}")
        
sys.stdout.close()
