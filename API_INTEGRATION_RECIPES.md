# Real-time Log API Integration Recipes

Ready-to-use configurations for popular logging and monitoring platforms.

## 🌩️ Cloud Platforms

### AWS CloudWatch Logs

**API Endpoint:**
```
https://logs.{region}.amazonaws.com
```

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'https://logs.us-east-1.amazonaws.com/api/v1/logs',
  method: 'GET',
  headers: {
    'Authorization': 'AWS4-HMAC-SHA256 ...',
    'X-Amz-Date': new Date().toISOString()
  },
  pollingInterval: 5000,
  retryAttempts: 3,
  parser: (data) => {
    const response = data as any
    return response.logEvents.map((event: any) => ({
      id: event.id,
      timestamp: new Date(event.timestamp).toISOString(),
      level: 'INFO',
      source: 'cloudwatch',
      message: event.message,
      metadata: event
    }))
  }
}
```

### Azure Application Insights

**API Endpoint:**
```
https://api.applicationinsights.io/v1
```

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'https://api.applicationinsights.io/v1/apps/{app-id}/query',
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY'
  },
  pollingInterval: 10000,
  parser: (data) => {
    const response = data as any
    return response.tables[0].rows.map((row: any) => ({
      id: row[0],
      timestamp: row[1],
      level: row[3],
      source: 'application-insights',
      message: row[4],
      metadata: { severity: row[3] }
    }))
  }
}
```

### Google Cloud Logging

**API Endpoint:**
```
https://logging.googleapis.com/v2
```

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'https://logging.googleapis.com/v2/projects/{project-id}/logs',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer {access-token}',
    'Content-Type': 'application/json'
  },
  pollingInterval: 5000,
  parser: (data) => {
    const response = data as any
    return response.entries.map((entry: any) => ({
      id: entry.name,
      timestamp: entry.timestamp,
      level: entry.severity,
      source: entry.resource.type,
      message: entry.jsonPayload.message || entry.textPayload,
      metadata: entry
    }))
  }
}
```

## 📊 Monitoring & Logging Services

### ELK Stack (Elasticsearch)

**Kibana API Endpoint:**
```
https://your-kibana-instance.com:5601/api/saved_objects/index-pattern
```

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'https://your-elasticsearch:9200/logs-*/_search',
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa('elastic:password'),
    'Content-Type': 'application/json'
  },
  pollingInterval: 3000,
  parser: (data) => {
    const response = data as any
    return response.hits.hits.map((hit: any) => ({
      id: hit._id,
      timestamp: hit._source.@timestamp,
      level: hit._source.level || 'INFO',
      source: hit._source.service || hit._index,
      message: hit._source.message,
      metadata: hit._source
    }))
  }
}
```

### Splunk

**REST API Endpoint:**
```
https://your-splunk-instance:8089/services/search/jobs
```

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'https://your-splunk:8089/services/search/jobs/export',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + splunkToken,
    'X-Splunk-Request-Timeout': '30'
  },
  pollingInterval: 5000,
  parser: (data) => {
    const response = data as any
    return response.results.map((result: any) => ({
      id: result._key,
      timestamp: result._time,
      level: result.severity || 'INFO',
      source: result.source,
      message: result._raw,
      metadata: result
    }))
  }
}
```

### Datadog

**API Endpoint:**
```
https://api.datadoghq.com/api/v1
```

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'https://api.datadoghq.com/api/v1/logs-queries/list',
  method: 'POST',
  headers: {
    'DD-API-KEY': 'YOUR_API_KEY',
    'DD-APPLICATION-KEY': 'YOUR_APP_KEY'
  },
  pollingInterval: 10000,
  parser: (data) => {
    const response = data as any
    return response.logs.map((log: any) => ({
      id: log.id,
      timestamp: new Date(log.timestamp).toISOString(),
      level: log.status || 'INFO',
      source: log.service,
      message: log.message,
      metadata: log
    }))
  }
}
```

### Grafana Loki

**API Endpoint:**
```
https://your-grafana-instance/loki/api/v1
```

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'https://your-grafana-loki/loki/api/v1/query_range',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + grafanaToken
  },
  pollingInterval: 5000,
  parser: (data) => {
    const response = data as any
    const results = response.data.result[0]?.values || []
    return results.map((entry: any, idx: number) => ({
      id: `loki-${Date.now()}-${idx}`,
      timestamp: new Date(parseInt(entry[0]) * 1000).toISOString(),
      level: 'INFO',
      source: 'loki',
      message: entry[1],
      metadata: { raw: entry }
    }))
  }
}
```

## 🐳 Container & Orchestration

### Docker Daemon

**API Endpoint:**
```
http://localhost:2375 or unix:///var/run/docker.sock
```

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'http://localhost:2375/containers/json?limit=10',
  method: 'GET',
  pollingInterval: 3000,
  parser: (data) => {
    const containers = data as any[]
    return containers.map((container, idx) => ({
      id: container.Id.substring(0, 12),
      timestamp: new Date(container.Created * 1000).toISOString(),
      level: 'INFO',
      source: container.Image,
      message: `Container: ${container.Names[0]}`,
      metadata: container
    }))
  }
}
```

### Kubernetes API

**API Endpoint:**
```
https://your-k8s-cluster:6443/api/v1
```

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'https://your-k8s:6443/api/v1/namespaces/default/pods',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_K8S_TOKEN',
    'Content-Type': 'application/json'
  },
  pollingInterval: 10000,
  parser: (data) => {
    const response = data as any
    return response.items.map((pod: any) => ({
      id: pod.metadata.uid,
      timestamp: pod.metadata.creationTimestamp,
      level: pod.status.phase === 'Running' ? 'INFO' : 'WARNING',
      source: `k8s/${pod.metadata.namespace}`,
      message: `Pod: ${pod.metadata.name} (${pod.status.phase})`,
      metadata: pod
    }))
  }
}
```

## 🚀 Development Tools

### Node.js/Express Server

**Local Development:**
```typescript
const config: StreamingConfig = {
  endpoint: 'http://localhost:3000/api/logs',
  method: 'GET',
  pollingInterval: 2000,
  retryAttempts: 2,
  parser: (data) => {
    const response = data as any
    return response.logs.map((log: any) => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.level,
      source: log.source || 'nodejs',
      message: log.message,
      metadata: log
    }))
  }
}
```

**Express Server Example:**
```javascript
const express = require('express');
const app = express();

const logs = [];

// Simulate log generation
setInterval(() => {
  logs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    level: ['INFO', 'WARNING', 'ERROR'][Math.floor(Math.random() * 3)],
    source: 'nodejs-app',
    message: `Test message ${Math.random()}`
  });
  
  if (logs.length > 100) logs.shift();
}, 1000);

app.get('/api/logs', (req, res) => {
  res.json({ logs });
});

app.listen(3000);
```

### Python/Flask Server

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'http://localhost:5000/api/logs',
  method: 'GET',
  pollingInterval: 3000,
  parser: (data) => {
    const response = data as any
    return response.data.map((log: any) => ({
      id: log.get('id'),
      timestamp: log.get('timestamp'),
      level: log.get('level'),
      source: log.get('source'),
      message: log.get('message'),
      metadata: log
    }))
  }
}
```

**Flask Server Example:**
```python
from flask import Flask, jsonify
from datetime import datetime
import random

app = Flask(__name__)
logs = []

@app.route('/api/logs')
def get_logs():
    global logs
    
    log_entry = {
        'id': f'log-{int(datetime.now().timestamp() * 1000)}',
        'timestamp': datetime.now().isoformat(),
        'level': random.choice(['INFO', 'WARNING', 'ERROR']),
        'source': 'python-app',
        'message': f'Test message {random.random()}'
    }
    logs.append(log_entry)
    
    if len(logs) > 100:
        logs.pop(0)
    
    return jsonify({'data': logs})

if __name__ == '__main__':
    app.run(port=5000)
```

## 🔌 Message Queues

### Apache Kafka

**Using Kafka REST Proxy:**
```typescript
const config: StreamingConfig = {
  endpoint: 'http://kafka-proxy:8082/topics/logs/partitions/0/messages',
  method: 'GET',
  headers: {
    'Accept': 'application/vnd.kafka.v2+json'
  },
  pollingInterval: 2000,
  parser: (data) => {
    const response = data as any
    return response.records.map((record: any) => ({
      id: `kafka-${record.key}`,
      timestamp: new Date().toISOString(),
      level: record.value.level || 'INFO',
      source: record.value.source || 'kafka',
      message: record.value.message,
      metadata: record.value
    }))
  }
}
```

### RabbitMQ

**Using RabbitMQ Management API:**
```typescript
const config: StreamingConfig = {
  endpoint: 'http://rabbitmq:15672/api/queues/%2F/logs/get',
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa('guest:guest'),
    'Content-Type': 'application/json'
  },
  pollingInterval: 3000,
  parser: (data) => {
    const response = data as any[]
    return response.map((msg: any) => {
      const payload = JSON.parse(msg.payload)
      return {
        id: msg.properties.message_id,
        timestamp: payload.timestamp,
        level: payload.level,
        source: payload.source,
        message: payload.message,
        metadata: payload
      }
    })
  }
}
```

## 📈 Time Series & Metrics

### Prometheus

**API Endpoint:**
```
http://localhost:9090/api/v1
```

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'http://localhost:9090/api/v1/query_range',
  method: 'GET',
  pollingInterval: 15000,
  parser: (data) => {
    const response = data as any
    return response.data.result.map((metric: any, idx: number) => ({
      id: `prometheus-${Date.now()}-${idx}`,
      timestamp: new Date().toISOString(),
      level: metric.value[1] > 0.8 ? 'WARNING' : 'INFO',
      source: metric.metric.__name__,
      message: `${metric.metric.__name__}: ${metric.value[1]}`,
      metadata: metric
    }))
  }
}
```

## 🔐 Custom Secure APIs

### OAuth 2.0 Protected Endpoint

**Configuration with Token Refresh:**
```typescript
const config: StreamingConfig = {
  endpoint: 'https://api.example.com/logs',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + getAccessToken(), // Call function to get fresh token
    'Content-Type': 'application/json'
  },
  pollingInterval: 5000,
  retryAttempts: 3,
  parser: (data) => {
    const response = data as any
    return response.logs.map((log: any) => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.level,
      source: log.source,
      message: log.message,
      metadata: log
    }))
  }
}

function getAccessToken(): string {
  // Fetch from your token provider
  // This is pseudo-code - implement proper OAuth flow
  return localStorage.getItem('access_token') || ''
}
```

## 🎯 Testing & Mock APIs

### JSONPlaceholder (Mock Data)

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'https://jsonplaceholder.typicode.com/posts',
  method: 'GET',
  pollingInterval: 5000,
  parser: (data) => {
    const posts = data as any[]
    return posts.slice(0, 10).map(post => ({
      id: `post-${post.id}`,
      timestamp: new Date().toISOString(),
      level: post.id % 3 === 0 ? 'ERROR' : 'INFO',
      source: 'jsonplaceholder',
      message: post.title,
      metadata: post
    }))
  }
}
```

### Faker API (Random Data)

**Configuration:**
```typescript
const config: StreamingConfig = {
  endpoint: 'https://api.eatcheese.com/api/logs',
  method: 'GET',
  pollingInterval: 3000,
  parser: (data) => {
    const logs = data as any[]
    return logs.map(log => ({
      id: log.id,
      timestamp: new Date().toISOString(),
      level: ['INFO', 'WARNING', 'ERROR'][Math.floor(Math.random() * 3)] as any,
      source: 'faker-api',
      message: log.description,
      metadata: log
    }))
  }
}
```

---

**Tips:**
- Always validate authentication credentials before deployment
- Test with staging/test environments first
- Implement proper error handling in parsers
- Monitor API rate limits
- Use HTTPS for production
- Implement certificate pinning for sensitive APIs
