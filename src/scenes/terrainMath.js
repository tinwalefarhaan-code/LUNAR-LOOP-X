import { CRATER_LANDMARKS } from '../learning/levelData.js'

const craterFields = CRATER_LANDMARKS.map((crater, index) => ({
  x: crater.position[0],
  z: crater.position[1],
  radius: crater.radius,
  depth: crater.depth,
  rim: [0.72, 0.9, 0.58, 0.5, 0.68, 0.4][index],
}))

export function terrainHeight(x, z) {
  let height = 0.24 * Math.sin(x * 0.18) * Math.cos(z * 0.16)
    + 0.12 * Math.sin((x + z) * 0.38)
    + 0.08 * Math.cos((x - z) * 0.57)

  for (const crater of craterFields) {
    const dx = x - crater.x
    const dz = z - crater.z
    const normalizedRadius = Math.hypot(dx, dz) / crater.radius

    if (normalizedRadius < 1) {
      const floorProfile = Math.max(0, 1 - normalizedRadius * normalizedRadius)
      height -= crater.depth * floorProfile ** 1.35
    }

    const rimDistance = (normalizedRadius - 1.03) / 0.11
    height += crater.rim * Math.exp(-(rimDistance * rimDistance))
    const ejectaDistance = (normalizedRadius - 1.22) / 0.25
    height += crater.depth * 0.018 * Math.exp(-(ejectaDistance * ejectaDistance))
  }

  const fineRelief = Math.sin(x * 1.73 + z * 2.11) * Math.cos(z * 1.57 - x * 0.82)
    + Math.sin((x - z) * 3.05) * 0.32
  return height + fineRelief * 0.014
}
