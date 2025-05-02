import { useRef, useEffect, useState, useMemo } from 'react'
import { useThree, extend } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'

export default function Experience() {
  const keyRefs = useRef([])
  const [pressedKeys, setPressedKeys] = useState(new Set())
  const noteDepth = 10
  const noteGap = 0.05

  const onKeyDown = (index) => {
    const key = keyRefs.current[index]
    if (!pressedKeys.has(index)) {
      setPressedKeys((prev) => new Set(prev).add(index))
      if (key) {
        gsap.to(key.rotation, {
          x: 0.05,
          duration: 0.1,
        })
      }
    }
  }

  const onKeyUp = () => {
    pressedKeys.forEach((index) => {
      const key = keyRefs.current[index]
      if (key) {
        gsap.to(key.rotation, {
          x: 0,
          duration: 0.1,
        })
      }
    })
    setPressedKeys(new Set())
  }

  const isPressed = (index) => {
    return pressedKeys.has(index)
  }

  useEffect(() => {
    window.addEventListener('pointerup', onKeyUp)
    return () => window.removeEventListener('pointerup', onKeyUp)
  }, [pressedKeys])

  const totalWidth = 52 * (1 + noteGap)
  const pianoOffsetX = -totalWidth / 2 + 0.5
  const pianoOffsetZ = -noteDepth / 2

  const getBlackKeyOffset = (index) => {
    switch (index % 12) {
      case 1:
        return .1
        break
      case 4:
        return -0.1
        break
      case 6:
        return 0.1
        break
      case 9:
        return -0.15
        break
      case 11:
        return 0
        break
      default:
        return 0
    }
  }

  const makeKeys = useMemo(() => {
    const keys = []
    let whiteKeyIndex = 0
    for (let i = 0; i < 88; i++) {
      const isBlackKey = [1, 4, 6, 9, 11].includes(i % 12)
      const keyWidth = isBlackKey ? 0.583 : 1
      const keyHeight = isBlackKey ? 0.75 : 1
      const keyDepth = isBlackKey ? noteDepth * 0.6 : noteDepth
      const keyColor = isBlackKey ? 'black' : 'white'
      const keyPositionX = isBlackKey ? (whiteKeyIndex - 0.5) * (1 + noteGap) + getBlackKeyOffset(i) : whiteKeyIndex * (1 + noteGap)
      const keyPositionY = isBlackKey ? 0.9 : 0
      whiteKeyIndex += isBlackKey ? 0 : 1

      keys.push(
        <mesh
          key={i}
          ref={(el) => (keyRefs.current[i] = el)}
          position={[keyPositionX, keyPositionY, 0]}
          onPointerDown={(event) => {
            onKeyDown(i)
            event.stopPropagation()
          }}
        >
          <primitive object={new THREE.BoxGeometry(keyWidth, keyHeight, keyDepth).translate(0, 0, 5)} />
          <meshStandardMaterial color={isPressed(i) ? 'red' : keyColor} />
        </mesh>
      )
    }
    return keys
  })

  return (
    <>
      {/* <OrbitControls /> */}
      <directionalLight position={[0, 10, 2]} intensity={5} />
      <ambientLight intensity={1} />

      <group position={[pianoOffsetX, 0, pianoOffsetZ]}>
        {makeKeys}
      </group>
    </>
  )
}
