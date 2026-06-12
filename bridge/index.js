const mqtt = require('mqtt');
const { Client } = require('@opensearch-project/opensearch');
const { computeStatus } = require('./wells');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const OPENSEARCH_URL = process.env.OPENSEARCH_URL || 'http://localhost:9200';
const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'well-telemetry';

const osClient = new Client({ node: OPENSEARCH_URL });

const mqttClient = mqtt.connect(MQTT_URL);

mqttClient.on('connect', () => {
  console.log(`Connected to MQTT broker at ${MQTT_URL}`);
  mqttClient.subscribe('sensors/+/data', { qos: 1 }, (err) => {
    if (err) {
      console.error('Subscribe error:', err);
      return;
    }
    console.log('Subscribed to sensors/+/data');
  });
});

mqttClient.on('error', (err) => {
  console.error('MQTT error:', err);
});

mqttClient.on('message', async (topic, payload) => {
  let reading;
  try {
    reading = JSON.parse(payload.toString());
  } catch (err) {
    console.error(`Failed to parse message on ${topic}:`, err.message);
    return;
  }

  if (reading.lat !== undefined && reading.lon !== undefined) {
    reading.location = { lat: reading.lat, lon: reading.lon };
    delete reading.lat;
    delete reading.lon;
  }

  if (!reading.timestamp) {
    reading.timestamp = new Date().toISOString();
  }

  const { status, alert } = computeStatus(reading);
  reading.status = status;
  reading.alert = alert;

  try {
    await osClient.index({
      index: OPENSEARCH_INDEX,
      body: reading,
    });
    console.log(
      `[${reading.timestamp}] ${reading.device_id} | tank=${reading.tank_level_pct}% temp=${reading.temperature_f}F pressure=${reading.pressure_psi}psi flow=${reading.flow_rate_bpd}bpd | status=${reading.status} alert=${reading.alert}`
    );
  } catch (err) {
    console.error(`Failed to index reading for ${reading.device_id}:`, err.message);
  }
});
