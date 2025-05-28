
import React from 'react';

export function AuthHeader() {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold text-game-foreground">
        Game<span className="text-game-accent">On</span>
      </h1>
      <p className="text-muted-foreground mt-2">Gaming management platform</p>
    </div>
  );
}
