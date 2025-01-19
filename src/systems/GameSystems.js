const checkOverlap = (topBlock, bottomBlock) => {
  if (!bottomBlock) return true;
  
  const overlapStart = Math.max(topBlock.position.x, bottomBlock.position.x);
  const overlapEnd = Math.min(
    topBlock.position.x + topBlock.size.width,
    bottomBlock.position.x + bottomBlock.size.width
  );
  
  return overlapEnd > overlapStart ? overlapEnd - overlapStart : 0;
};

export const MovementSystem = (entities, { time, dispatch }) => {
  Object.keys(entities).forEach(blockId => {
    const block = entities[blockId];
    if (!block.stopped && block.moving) {
      block.position.x += block.direction * block.speed * (time.delta || 0);
      
      // Reverse direction at screen edges
      if (block.position.x > block.screenWidth - block.size.width || block.position.x < 0) {
        block.direction *= -1;
      }
    }
  });
  
  return entities;
};

export const BlockStackSystem = (entities, { events = [] }) => {
  events.forEach(event => {
    if (event.type === "game-tap") {
      const currentBlock = Object.values(entities).find(entity => entity.moving);
      if (currentBlock) {
        currentBlock.moving = false;
        currentBlock.stopped = true;
        
        // Get the block below
        const blockBelow = Object.values(entities)
          .filter(entity => !entity.moving && entity !== currentBlock)
          .sort((a, b) => b.position.y - a.position.y)[0];
        
        const overlap = checkOverlap(currentBlock, blockBelow);
        
        if (overlap) {
          // Adjust block size based on overlap
          const newWidth = overlap;
          currentBlock.size.width = newWidth;
          
          // Create new block for next level
          const newBlockId = `block-${Object.keys(entities).length}`;
          entities[newBlockId] = {
            position: { x: 0, y: currentBlock.position.y - currentBlock.size.height },
            size: { width: newWidth, height: currentBlock.size.height },
            direction: 1,
            speed: currentBlock.speed * 1.1, // Increase speed for difficulty
            moving: true,
            stopped: false,
            screenWidth: currentBlock.screenWidth,
            renderer: currentBlock.renderer
          };
        } else {
          // Game over condition
          dispatch({ type: "game-over" });
        }
      }
    }
  });
  
  return entities;
}; 