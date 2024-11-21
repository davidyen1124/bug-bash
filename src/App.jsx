import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import './App.css'

const bugs = ['🐛', '🐜', '🪲', '🐞']

// Define a Bug class
class Bug {
  constructor(id, x, y, type, dx, dy) {
    this.id = id
    this.x = x
    this.y = y
    this.type = type
    this.dx = dx
    this.dy = dy
    this.isSquashed = false
  }

  // Update the bug's position and handle boundary collisions
  updatePosition() {
    if (this.isSquashed) return

    this.x += this.dx
    this.y += this.dy

    // Reverse direction if the bug hits the window boundaries
    if (this.x < 0 || this.x > window.innerWidth - 30) {
      this.dx = -this.dx
      this.x += this.dx
    }
    if (this.y < 0 || this.y > window.innerHeight - 30) {
      this.dy = -this.dy
      this.y += this.dy
    }
  }
}

function App() {
  const [score, setScore] = useState(0)
  const bugListRef = useRef([]) // Ref to store the list of bugs
  const animationFrameRef = useRef(null) // Ref to store the animation frame ID
  const gameAreaRef = useRef(null) // Ref to the game area for direct DOM manipulation

  // Function to create a new bug
  const createBug = useCallback(() => {
    if (bugListRef.current.length >= 30) return // Limit the number of bugs to 30

    const id = uuidv4()

    const x = Math.random() * (window.innerWidth - 60)
    const y = Math.random() * (window.innerHeight - 60)

    const speedMultiplier = 5

    const newBug = new Bug(
      id,
      x,
      y,
      bugs[Math.floor(Math.random() * bugs.length)],
      (Math.random() - 0.5) * speedMultiplier,
      (Math.random() - 0.5) * speedMultiplier
    )

    bugListRef.current.push(newBug)

    // Create a new DOM element for the bug
    const bugElement = document.createElement('div')
    bugElement.className = 'bug'
    bugElement.style.left = `${x}px`
    bugElement.style.top = `${y}px`
    bugElement.innerText = newBug.type
    bugElement.onclick = () => squashBug(newBug.id)

    // Append the bug to the game area
    gameAreaRef.current.appendChild(bugElement)
  }, []) // No dependencies since it doesn't rely on external state

  // Function to move bugs using requestAnimationFrame
  const moveBugs = useCallback(() => {
    bugListRef.current.forEach((bug, index) => {
      const bugElement = gameAreaRef.current.children[index]

      // Skip moving squashed bugs
      if (bugElement && bugElement.classList.contains('squashed')) {
        return
      }

      bug.updatePosition()

      // Update the corresponding DOM element's position
      if (bugElement) {
        bugElement.style.left = `${bug.x}px`
        bugElement.style.top = `${bug.y}px`
      }
    })

    // Request the next animation frame
    animationFrameRef.current = requestAnimationFrame(moveBugs)
  }, []) // No dependencies since it doesn't rely on external state

  // Remove a bug when clicked and create a new one
  const squashBug = (id) => {
    const bugIndex = bugListRef.current.findIndex((bug) => bug.id === id)
    if (bugIndex !== -1) {
      const bug = bugListRef.current[bugIndex]
      const bugElement = gameAreaRef.current.children[bugIndex]
      if (bugElement) {
        // Change the bug to a tomb emoji and apply the "squashed" class
        bugElement.innerText = '🪦' // Change to tomb emoji
        bugElement.classList.add('squashed')
        bug.isSquashed = true

        // Remove the tomb after 10 seconds
        setTimeout(() => {
          if (bugElement && gameAreaRef.current.contains(bugElement)) {
            gameAreaRef.current.removeChild(bugElement)
            bugListRef.current = bugListRef.current.filter((b) => b.id !== id)
          }
        }, 10000)
      }

      setScore((prev) => prev + 1)

      // Create a new bug after squashing
      createBug()
    }
  }

  // Start the game on mount
  useEffect(() => {
    // Create 20 bugs initially
    for (let i = 0; i < 20; i++) {
      createBug()
    }

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(moveBugs)

    return () => {
      // Cleanup the animation frame on unmount
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [createBug, moveBugs])

  return (
    <div>
      <div id='score'>
        Score: <span id='scoreValue'>{score}</span>
      </div>
      <div id='gameArea' ref={gameAreaRef}></div>
    </div>
  )
}

export default App
