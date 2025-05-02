import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'

export default function Experience() {
  const keyRefs = useRef([])
  const [pressedKeys, setPressedKeys] = useState(new Set())
  const midiAccessRef = useRef(null)
  const noteDepth = 10
  const noteGap = 0.05

  // Use callbacks to prevent recreation on each render
  const onKeyDown = useCallback((index) => {
    if (index < 0 || index >= 88) return // Bounds check
    
    setPressedKeys((prev) => {
      const newSet = new Set(prev)
      newSet.add(index)
      return newSet
    })
    
    const key = keyRefs.current[index]
    if (key) {
      gsap.to(key.rotation, {
        x: 0.05,
        duration: 0.1,
      })
    }
  }, [])

  const onKeyUp = useCallback((index) => {
    if (index < 0 || index >= 88) return // Bounds check
    
    setPressedKeys((prev) => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
    
    const key = keyRefs.current[index]
    if (key) {
      gsap.to(key.rotation, {
        x: 0,
        duration: 0.1,
      })
    }
  }, [])

  // MIDI message handler as stable callback
  const onMIDIMessage = useCallback((event) => {
    try {
      const message = event.data
      const command = message[0]
      const note = message[1]
      const velocity = message[2]
      
      // Map MIDI note to piano key (MIDI notes start at 21 for A0)
      const keyIndex = note - 21
      
      // Check if the note is within our piano range
      if (keyIndex >= 0 && keyIndex < 88) {
        if (command === 144 && velocity > 0) { // Note On
          onKeyDown(keyIndex)
        } else if (command === 128 || (command === 144 && velocity === 0)) { // Note Off
          onKeyUp(keyIndex)
        }
      }
    } catch (error) {
      console.error("Error handling MIDI message:", error)
    }
  }, [onKeyDown, onKeyUp])

  // Properly setup and cleanup MIDI access
  useEffect(() => {
    let isMounted = true
    const midiInputs = []
    
    const setupMIDI = async () => {
      try {
        if (!navigator.requestMIDIAccess) {
          console.warn("WebMIDI is not supported in this browser")
          return
        }
        
        const midiAccess = await navigator.requestMIDIAccess()
        if (!isMounted) return
        
        midiAccessRef.current = midiAccess
        
        const inputs = midiAccess.inputs.values()
        for (const input of inputs) {
          input.onmidimessage = onMIDIMessage
          midiInputs.push(input)
        }
        
        // Listen for connections/disconnections
        midiAccess.onstatechange = (event) => {
          if (event.port.type === "input") {
            if (event.port.state === "connected") {
              event.port.onmidimessage = onMIDIMessage
              if (!midiInputs.includes(event.port)) {
                midiInputs.push(event.port)
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to access MIDI devices:", error)
      }
    }
    
    setupMIDI()
    
    // Clean up
    return () => {
      isMounted = false
      midiInputs.forEach(input => {
        input.onmidimessage = null
      })
      if (midiAccessRef.current) {
        midiAccessRef.current.onstatechange = null
      }
    }
  }, [onMIDIMessage])

  // Separate pointer event cleanup
  useEffect(() => {
    // Nothing to clean up for global pointerup in this implementation
    return () => {}
  }, [])

  // Stable function to check if a key is pressed
  const isPressed = useCallback((index) => {
    return pressedKeys.has(index)
  }, [pressedKeys])

  const totalWidth = 52 * (1 + noteGap)
  const pianoOffsetX = -totalWidth / 2 + 0.5
  const pianoOffsetZ = -noteDepth / 2

  const getBlackKeyOffset = useCallback((index) => {
    switch (index % 12) {
      case 1: return 0.1
      case 4: return -0.1
      case 6: return 0.1
      case 9: return -0.15
      case 11: return 0
      default: return 0
    }
  }, [])

  // Create keys with proper cleanup of gsap animations
  const makeKeys = useMemo(() => {
    const keys = []
    let whiteKeyIndex = 0
    
    for (let i = 0; i < 88; i++) {
      const isBlackKey = [1, 4, 6, 9, 11].includes(i % 12)
      const keyWidth = isBlackKey ? 0.583 : 1
      const keyHeight = isBlackKey ? 0.75 : 1
      const keyDepth = isBlackKey ? noteDepth * 0.6 : noteDepth
      const keyColor = isBlackKey ? 'black' : 'white'
      const keyPositionX = isBlackKey 
        ? (whiteKeyIndex - 0.5) * (1 + noteGap) + getBlackKeyOffset(i) 
        : whiteKeyIndex * (1 + noteGap)
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
          onPointerUp={(event) => {
            onKeyUp(i)
            event.stopPropagation()
          }}
        >
          <primitive object={new THREE.BoxGeometry(keyWidth, keyHeight, keyDepth).translate(0, 0, 5)} />
          <meshStandardMaterial color={isPressed(i) ? 'red' : keyColor} />
        </mesh>
      )
    }
    return keys
  }, [getBlackKeyOffset, isPressed, onKeyDown, onKeyUp])

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