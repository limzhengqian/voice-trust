import React, { useState } from 'react';
import Landing from './pages/Landing';
import OnboardingFlow from './pages/OnboardingFlow';
import Success from './pages/Success';

const SCREENS = { LANDING: 'landing', ONBOARDING: 'onboarding', SUCCESS: 'success' };

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [applicationId, setApplicationId] = useState(null);
  const [completedData, setCompletedData] = useState(null);

  if (screen === SCREENS.LANDING) {
    return <Landing onStart={() => setScreen(SCREENS.ONBOARDING)} />;
  }
  if (screen === SCREENS.ONBOARDING) {
    return (
      <OnboardingFlow
        onComplete={(id, data) => {
          setApplicationId(id);
          setCompletedData(data);
          setScreen(SCREENS.SUCCESS);
        }}
        onBack={() => setScreen(SCREENS.LANDING)}
      />
    );
  }
  return <Success applicationId={applicationId} data={completedData} onRestart={() => setScreen(SCREENS.LANDING)} />;
}
