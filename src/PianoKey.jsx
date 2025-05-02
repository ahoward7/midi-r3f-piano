import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function PianoKey({ index, isBlack, position, dimensions, color, onKeyDown, onKeyUp, keyRefs, isPressed }) {
  const meshRef = useRef(null)

  useEffect(() => {
    keyRefs.current[index] = meshRef.current
  }, [index, keyRefs])

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerDown={(event) => {
        onKeyDown(index)
        event.stopPropagation()
      }}
      onPointerUp={(event) => {
        onKeyUp(index)
        event.stopPropagation()
      }}
    >
      <primitive object={new THREE.BoxGeometry(...dimensions).translate(0, 0, 5)} />
      <meshStandardMaterial color={isPressed ? 'red' : color} />
    </mesh>
  )
}
