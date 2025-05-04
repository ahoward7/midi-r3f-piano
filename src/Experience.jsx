import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import gsap from 'gsap'
import PianoKey from './PianoKey'

export default function Experience() {
  const keyRefs = useRef([])
  const [pressedKeys, setPressedKeys] = useState(new Set())
  const animationsRef = useRef({})
  const lastMIDIEventTime = useRef({})
  const activeInputs = useRef(new Set())

  const noteDepth = 8
  const noteGap = 0.05

  const animateKey = (index, down) => {
    const key = keyRefs.current[index]
    if (!key) return

    const targetX = down ? 0.05 : 0

    if (animationsRef.current[index]) {
      animationsRef.current[index].kill()
    }

    animationsRef.current[index] = gsap.to(key.rotation, {
      x: targetX,
      duration: 0.05,
    })
  }

  const onKeyDown = useCallback((index) => {
    if (index < 0 || index >= 88) return

    setPressedKeys((prev) => {
      if (prev.has(index)) return prev
      const next = new Set(prev)
      next.add(index)
      return next
    })

    animateKey(index, true)
  }, [])

  const onKeyUp = useCallback((index, velocity) => {
    if (index < 0 || index >= 88) return

    setPressedKeys((prev) => {
      if (!prev.has(index)) return prev
      const next = new Set(prev)
      next.delete(index)
      return next
    })

    animateKey(index, false, velocity)
  }, [])

  const onMIDIMessage = useCallback((event) => {
    try {
      const [command, note, velocity] = event.data
      const keyIndex = note - 21

      if (keyIndex < 0 || keyIndex >= 88) return

      const now = performance.now()
      const last = lastMIDIEventTime.current[keyIndex] || 0

      if (now - last < 10) return
      lastMIDIEventTime.current[keyIndex] = now

      if (command === 144 && velocity > 0) {
        onKeyDown(keyIndex)
      } else if (command === 128 || (command === 144 && velocity === 0)) {
        onKeyUp(keyIndex)
      }
    } catch (err) {
      console.error('MIDI error:', err)
    }
  }, [onKeyDown, onKeyUp])

  useEffect(() => {
    let midiAccess

    const handleInput = (input) => {
      if (!activeInputs.current.has(input.id)) {
        input.onmidimessage = onMIDIMessage
        activeInputs.current.add(input.id)
      }
    }

    const setupMIDI = async () => {
      try {
        midiAccess = await navigator.requestMIDIAccess()
        midiAccess.inputs.forEach(handleInput)

        midiAccess.onstatechange = (e) => {
          const port = e.port
          if (port.type === 'input') {
            if (port.state === 'connected') handleInput(port)
            else if (port.state === 'disconnected') activeInputs.current.delete(port.id)
          }
        }
      } catch (err) {
        console.error('MIDI setup error:', err)
      }
    }

    setupMIDI()

    return () => {
      if (midiAccess) {
        midiAccess.inputs.forEach((input) => {
          input.onmidimessage = null
        })
      }

      Object.values(animationsRef.current).forEach((anim) => anim?.kill())
      animationsRef.current = {}
      activeInputs.current.clear()
    }
  }, [onMIDIMessage])

  useEffect(() => {
    return () => {
      keyRefs.current = []
      lastMIDIEventTime.current = {}
    }
  }, [])

  const totalWidth = 52 * (1 + noteGap)
  const offsetX = -totalWidth / 2 + 0.5 * (1 + noteGap)

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

  const keyProps = useMemo(() => {
    const keys = []
    let whiteKeyIndex = 0

    for (let i = 0; i < 88; i++) {
      const isBlack = [1, 4, 6, 9, 11].includes(i % 12)
      const width = isBlack ? 0.583 : 1
      const height = isBlack ? 0.75 : 1
      const depth = isBlack ? noteDepth * 0.6 : noteDepth
      const color = isBlack ? 'black' : 'white'
      const offset = getBlackKeyOffset(i)
      const x = isBlack ? (whiteKeyIndex - 0.5) * (1 + noteGap) + offset : whiteKeyIndex * (1 + noteGap)
      const y = isBlack ? 0.9 : 0
      const position = [x, y, 0]

      if (!isBlack) whiteKeyIndex++
      keys.push({ index: i, isBlack, position, dimensions: [width, height, depth], color })
    }

    return keys
  }, [getBlackKeyOffset])

  return (
    <>
      <color args={['#171717']} attach="background" />

      <directionalLight position={[0, 10, 2]} intensity={5} />
      <ambientLight intensity={1} />

      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[totalWidth, 0.1, 2]} />
        <meshStandardMaterial color="#171717" />
      </mesh>


      <group position={[offsetX, 0, -1.5]}>
        {keyProps.map(({ index, isBlack, position, dimensions, color }) => (
          <PianoKey
            key={index}
            index={index}
            isBlack={isBlack}
            position={position}
            dimensions={dimensions}
            color={color}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            keyRefs={keyRefs}
            isPressed={pressedKeys.has(index)}
          />
        ))}
      </group>
    </>
  )
}
