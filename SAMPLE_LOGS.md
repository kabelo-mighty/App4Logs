# Sample Log Files for Testing

## sample-logs.json

```json
[
  {
    "timestamp": "2024-01-27T08:15:22Z",
    "level": "INFO",
    "source": "API Gateway",
    "message": "Request received from client 192.168.1.100"
  },
  {
    "timestamp": "2024-01-27T08:15:23Z",
    "level": "DEBUG",
    "source": "Database",
    "message": "Executing query: SELECT * FROM users"
  },
  {
    "timestamp": "2024-01-27T08:15:25Z",
    "level": "WARNING",
    "source": "Cache",
    "message": "Cache miss for key: user_session_123"
  },
  {
    "timestamp": "2024-01-27T08:15:27Z",
    "level": "ERROR",
    "source": "API Gateway",
    "message": "Failed to process request: Connection timeout after 30s"
  },
  {
    "timestamp": "2024-01-27T08:15:30Z",
    "level": "INFO",
    "source": "Authentication",
    "message": "User authenticated successfully: john.doe@example.com"
  }
]
```

## sample-logs.txt

```
[INFO] 2024-01-27T08:15:22 API Gateway Request received from client 192.168.1.100
[DEBUG] 2024-01-27T08:15:23 Database Executing query: SELECT * FROM users
[WARNING] 2024-01-27T08:15:25 Cache Cache miss for key: user_session_123
[ERROR] 2024-01-27T08:15:27 API Gateway Failed to process request: Connection timeout after 30s
[INFO] 2024-01-27T08:15:30 Authentication User authenticated successfully: john.doe@example.com
```

## sample-logs.csv

```csv
timestamp,level,source,message
2024-01-27T08:15:22Z,INFO,API Gateway,Request received from client 192.168.1.100
2024-01-27T08:15:23Z,DEBUG,Database,Executing query: SELECT * FROM users
2024-01-27T08:15:25Z,WARNING,Cache,Cache miss for key: user_session_123
2024-01-27T08:15:27Z,ERROR,API Gateway,Failed to process request: Connection timeout after 30s
2024-01-27T08:15:30Z,INFO,Authentication,User authenticated successfully: john.doe@example.com
```

## sample-logs.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<logs>
  <log>
    <timestamp>2024-01-27T08:15:22Z</timestamp>
    <level>INFO</level>
    <source>API Gateway</source>
    <message>Request received from client 192.168.1.100</message>
  </log>
  <log>
    <timestamp>2024-01-27T08:15:23Z</timestamp>
    <level>DEBUG</level>
    <source>Database</source>
    <message>Executing query: SELECT * FROM users</message>
  </log>
  <log>
    <timestamp>2024-01-27T08:15:25Z</timestamp>
    <level>WARNING</level>
    <source>Cache</source>
    <message>Cache miss for key: user_session_123</message>
  </log>
  <log>
    <timestamp>2024-01-27T08:15:27Z</timestamp>
    <level>ERROR</level>
    <source>API Gateway</source>
    <message>Failed to process request: Connection timeout after 30s</message>
  </log>
  <log>
    <timestamp>2024-01-27T08:15:30Z</timestamp>
    <level>INFO</level>
    <source>Authentication</source>
    <message>User authenticated successfully: john.doe@example.com</message>
  </log>
</logs>
```
