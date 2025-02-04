import logger from 'util/logger';
import convertToSnakeCase from 'util/snakeCase';

class CloudConnectionHandler {
  constructor(cloud, queue) {
    this.cloud = cloud;
    this.queue = queue;
  }

  async start() {
    this.cloud.onDataUpdated(this.onDataUpdated.bind(this));
    this.cloud.onDataRequested(this.onDataRequested.bind(this));
    this.cloud.onDeviceUnregistered(this.onDeviceUnregistered.bind(this));
    this.cloud.onDisconnected(this.onDisconnected.bind(this));
    this.cloud.onReconnected(this.onReconnected.bind(this));
  }

  async onDataUpdated(id, data) {
    data.forEach(({ sensorId, value }) => {
      logger.debug(`Update data from ${sensorId} of thing ${id}: ${value}`);
    });

    await this.queue.send('fog', 'data.update', { id, data: convertToSnakeCase(data) });
  }

  async onDataRequested(id, sensorIds) {
    logger.debug(`Data requested from ${sensorIds} of thing ${id}`);
    await this.queue.send('fog', 'data.request', { id, data: sensorIds });
  }

  async onDeviceUnregistered(id) {
    logger.debug(`Device ${id} unregistered`);
    await this.queue.send('fog', 'device.unregistered', { id });
  }

  async onDisconnected() {
    logger.debug('Cloud disconnected');
    await this.queue.send('control', 'disconnected', {});
  }

  async onReconnected() {
    logger.debug('Cloud reconnected');
    await this.queue.send('control', 'reconnected', {});
  }
}

export default CloudConnectionHandler;
