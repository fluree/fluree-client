import { GenericContainer } from 'testcontainers';
import fs from 'fs';
import path from 'path';

interface FlureeConfig {
  images: Array<{
    tag: string;
    description: string;
  }>;
  defaultImage: string;
  containerPort: number;
  hostPort: number;
}

const configPath = path.join(__dirname, 'fluree-images.json');
const flureeConfig: FlureeConfig = JSON.parse(
  fs.readFileSync(configPath, 'utf8'),
);

function getFlureeImage(): string {
  const envImage = process.env.FLUREE_TEST_IMAGE;
  return envImage || flureeConfig.defaultImage;
}

async function getFlureeContainer(): Promise<GenericContainer> {
  const imageTag = getFlureeImage();
  const container = await new GenericContainer(`fluree/server:${imageTag}`)
    .withExposedPorts(flureeConfig.containerPort)
    .withReuse();
  return container;
}

module.exports = async () => {
  const container = await getFlureeContainer();
  const testContainer = await container.start();
  await testContainer.stop();
};
