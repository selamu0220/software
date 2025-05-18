import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { Volume2, VolumeX } from 'lucide-react';

export const AnimationShowcase = () => {
  const { playSound, toggleMute, muted } = useSoundEffects();
  const [activeDemoTab, setActiveDemoTab] = useState('buttons');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Componentes Interactivos</h2>
        <AnimatedButton 
          variant="ghost" 
          size="sm" 
          soundEffect="click"
          onClick={toggleMute}
          tooltip={muted ? "Activar sonido" : "Silenciar"}
          className="w-10 h-10 p-0"
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </AnimatedButton>
      </div>

      <Tabs value={activeDemoTab} onValueChange={setActiveDemoTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="buttons" onClick={() => playSound('click')}>Botones</TabsTrigger>
          <TabsTrigger value="cards" onClick={() => playSound('click')}>Tarjetas</TabsTrigger>
          <TabsTrigger value="sounds" onClick={() => playSound('click')}>Sonidos</TabsTrigger>
        </TabsList>

        <TabsContent value="buttons">
          <Card>
            <CardHeader>
              <CardTitle>Botones Animados</CardTitle>
              <CardDescription>
                Prueba los diferentes efectos de animación y sonido en los botones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4">
                  <h3 className="text-md font-medium">Efecto Pulse</h3>
                  <AnimatedButton animation="pulse" soundEffect="click">
                    Pulse
                  </AnimatedButton>
                </div>
                <div className="space-y-4">
                  <h3 className="text-md font-medium">Efecto Bounce</h3>
                  <AnimatedButton animation="bounce" soundEffect="click">
                    Bounce
                  </AnimatedButton>
                </div>
                <div className="space-y-4">
                  <h3 className="text-md font-medium">Efecto Grow</h3>
                  <AnimatedButton animation="grow" soundEffect="click">
                    Grow
                  </AnimatedButton>
                </div>
                <div className="space-y-4">
                  <h3 className="text-md font-medium">Efecto Shake</h3>
                  <AnimatedButton animation="shake" soundEffect="error">
                    Shake
                  </AnimatedButton>
                </div>
                <div className="space-y-4">
                  <h3 className="text-md font-medium">Sonido de Éxito</h3>
                  <AnimatedButton animation="pulse" soundEffect="success" variant="outline">
                    Success
                  </AnimatedButton>
                </div>
                <div className="space-y-4">
                  <h3 className="text-md font-medium">Sin Animación</h3>
                  <AnimatedButton animation="none" soundEffect="click" variant="secondary">
                    Sin Animación
                  </AnimatedButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <Card>
            <CardHeader>
              <CardTitle>Tarjetas Animadas</CardTitle>
              <CardDescription>
                Tarjetas con diferentes efectos al pasar el cursor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['lift', 'glow', 'scale', 'tilt', 'none'].map((effect, i) => (
                  <AnimatedCard 
                    key={effect} 
                    hoverEffect={effect as any}
                    delayed={true}
                    index={i}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">Efecto {effect}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Pasa el cursor para ver el efecto {effect}</p>
                    </CardContent>
                  </AnimatedCard>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sounds">
          <Card>
            <CardHeader>
              <CardTitle>Efectos de Sonido</CardTitle>
              <CardDescription>
                Prueba los diferentes efectos de sonido disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AnimatedButton variant="outline" onClick={() => playSound('click')} animation="none">
                  Sonido Click
                </AnimatedButton>
                <AnimatedButton variant="outline" onClick={() => playSound('hover')} animation="none">
                  Sonido Hover
                </AnimatedButton>
                <AnimatedButton variant="outline" onClick={() => playSound('success')} animation="none">
                  Sonido Success
                </AnimatedButton>
                <AnimatedButton variant="outline" onClick={() => playSound('error')} animation="none">
                  Sonido Error
                </AnimatedButton>
                <AnimatedButton variant="outline" onClick={() => playSound('intro')} animation="none">
                  Sonido Intro
                </AnimatedButton>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};