import { GenericContainer } from 'testcontainers';

// eslint-disable-next-line jsdoc/require-jsdoc
async function getFlureeContainer(): Promise<GenericContainer> {
  const container = await new GenericContainer(
    // 'fluree/server:791ac62648fdf5d202e89f22f4e4b57711fdd061'
    'fluree/server:latest',
  )
    .withExposedPorts(8090)
    .withReuse();
  return container;
}

module.exports = async () => {
  const container = await getFlureeContainer();
  const testContainer = await container.start();
  await testContainer.stop();
};
