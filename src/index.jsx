import './style.css'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './Experience'
import { OrbitControls, OrthographicCamera } from '@react-three/drei'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
  <Canvas>
    <OrthographicCamera
      makeDefault
      position={[0, 25, 0]} // position above the scene
      zoom={25}
      near={0.1}
      far={200}
      onUpdate={self => self.lookAt(0, 0, 0)} // look at the origin
    />
    {/* Optional: enable controls for interaction */}
    {/* <OrbitControls /> */}
    <Experience />
  </Canvas>
)
