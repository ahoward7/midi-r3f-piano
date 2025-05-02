import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import gsap from 'gsap'
import PianoKey from './PianoKey'

export default function Experience() {
  const keyRefs = useRef([])
  const [pressedKeys, setPressedKeys] = useState(new Set())
  const noteDepth = 10
  const noteGap = 0.05

  // Add to pressed keys and animate key down
  const onKeyDown = useCallback((index) => {
    if (index < 0 || index >= 88) return

    setPressedKeys((prev) => {
      const newSet = new Set(prev)
      newSet.add(index)
      return newSet
    })

    const key = keyRefs.current[index]
    if (key) {
      gsap.to(key.rotation, { x: 0.05, duration: 0.1 })
    }
  }, [])

  // Remove from pressed keys and animate key up
  const onKeyUp = useCallback((index) => {
    if (index < 0 || index >= 88) return

    setPressedKeys((prev) => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })

    const key = keyRefs.current[index]
    if (key) {
      gsap.to(key.rotation, { x: 0, duration: 0.1 })
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

      // Check if key is within range
      if (keyIndex >= 0 && keyIndex < 88) {
        if (command === 144 && velocity > 0) {
          onKeyDown(keyIndex)
        }
        else if (command === 128 || (command === 144 && velocity === 0)) {
          onKeyUp(keyIndex)
        }
      }
    }
    catch (error) {
      console.error("Error handling MIDI message:", error)
    }
  }, [onKeyDown, onKeyUp])

  // Setup and cleaup MIDI input
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then((midiAccess) => {
        const inputs = Array.from(midiAccess.inputs.values())

        inputs.forEach((input) => {
          input.onmidimessage = onMIDIMessage
        })

        midiAccess.onstatechange = (event) => {
          const port = event.port
          if (port.type === "input" && port.state === "connected") {
            port.onmidimessage = onMIDIMessage
          }
        }
      })
    }
    else {
      console.warn("Web MIDI API not supported in this browser.")
    }

    return () => { }
  }, [onMIDIMessage])

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

  const keyProps = useMemo(() => {
    const keys = []
    let whiteKeyIndex = 0

    for (let i = 0; i < 88; i++) {
      const isBlackKey = [1, 4, 6, 9, 11].includes(i % 12)
      const width = isBlackKey ? 0.583 : 1
      const height = isBlackKey ? 0.75 : 1
      const depth = isBlackKey ? noteDepth * 0.6 : noteDepth
      const color = isBlackKey ? 'black' : 'white'
      const offset = getBlackKeyOffset(i)
      const x = isBlackKey
        ? (whiteKeyIndex - 0.5) * (1 + noteGap) + offset
        : whiteKeyIndex * (1 + noteGap)
      const y = isBlackKey ? 0.9 : 0
      const position = [x, y, 0]

      if (!isBlackKey) whiteKeyIndex++

      keys.push({ index: i, isBlack: isBlackKey, position, dimensions: [width, height, depth], color })
    }

    return keys
  }, [getBlackKeyOffset])


  return (
    <>
      {/* <OrbitControls /> */}
      <directionalLight position={[0, 10, 2]} intensity={5} />
      <ambientLight intensity={1} />

      <group position={[pianoOffsetX, 0, pianoOffsetZ]}>
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
