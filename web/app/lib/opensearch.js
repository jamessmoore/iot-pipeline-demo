import { Client } from '@opensearch-project/opensearch';
import { WELLS } from './wells';

const OPENSEARCH_URL = process.env.OPENSEARCH_URL || 'http://localhost:9200';
const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'well-telemetry';

let client;

function getClient() {
  if (!client) {
    client = new Client({ node: OPENSEARCH_URL });
  }
  return client;
}

/**
 * Returns the most recent telemetry document for each of the 10 wells.
 */
export async function getLatestForAllWells() {
  const response = await getClient().search({
    index: OPENSEARCH_INDEX,
    body: {
      size: WELLS.length,
      sort: [{ timestamp: { order: 'desc' } }],
      collapse: { field: 'device_id' },
    },
  });

  return response.body.hits.hits.map((hit) => hit._source);
}

/**
 * Returns telemetry history for a single well, oldest first.
 */
export async function getHistory(deviceId, size = 50, from = null) {
  const must = [{ term: { device_id: deviceId } }];
  if (from) {
    must.push({ range: { timestamp: { gte: from } } });
  }

  const response = await getClient().search({
    index: OPENSEARCH_INDEX,
    body: {
      size,
      query: { bool: { must } },
      sort: [{ timestamp: { order: 'desc' } }],
    },
  });

  return response.body.hits.hits.map((hit) => hit._source).reverse();
}

/**
 * Returns the most recent alert events for a single well, newest first.
 */
export async function getAlertHistory(deviceId, size = 20) {
  const response = await getClient().search({
    index: OPENSEARCH_INDEX,
    body: {
      size,
      query: {
        bool: {
          must: [{ term: { device_id: deviceId } }],
          must_not: [{ term: { alert: 'none' } }],
        },
      },
      sort: [{ timestamp: { order: 'desc' } }],
    },
  });

  return response.body.hits.hits.map((hit) => hit._source);
}
