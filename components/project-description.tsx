import { Target, Shield, Globe, Users, BarChart3, Zap, Info, X, Activity, Heart, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ProjectDescriptionProps {
  isModal?: boolean
  onClose?: () => void
}

function ProjectDescriptionContent({ isModal = false, onClose }: ProjectDescriptionProps) {
  return (
    <div className="space-y-6">
      {/* Header pour le modal */}
      {isModal && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">À propos d'AirWatch Bénin</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* En-tête */}
      <div className="glass-effect rounded-2xl p-6 border border-border/50 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h2 className={`${isModal ? 'text-lg' : 'text-xl'} font-semibold`}>Notre Mission</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Protéger votre santé et celle de vos proches en surveillant la qualité de l'air 
          que vous respirez chaque jour. Nous rendons ces informations vitales accessibles 
          à tous les Béninois, gratuitement et en temps réel.
        </p>
      </div>

      {/* Pourquoi c'est important */}
      <div className="glass-effect rounded-2xl p-6 border border-border/50 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Pourquoi surveiller l'air ?</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm mb-1">Votre Santé</h4>
              <p className="text-xs text-muted-foreground">
                L'air pollué peut causer de l'asthme, des problèmes cardiaques et bien d'autres maladies. 
                Connaître la qualité de l'air vous aide à mieux vous protéger.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm mb-1">Vos Enfants</h4>
              <p className="text-xs text-muted-foreground">
                Les enfants sont plus sensibles à la pollution. Nos alertes vous permettent 
                de décider quand il est sûr de jouer dehors.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Leaf className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm mb-1">Notre Environnement</h4>
              <p className="text-xs text-muted-foreground">
                Ensemble, nous pouvons agir pour préserver notre beau pays 
                et laisser un air pur aux générations futures.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ce que nous offrons */}
      <div className="glass-effect rounded-2xl p-6 border border-border/50 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Ce que nous vous offrons</h3>
        </div>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <span>Des informations claires et faciles à comprendre sur la qualité de l'air</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <span>Des alertes quand l'air devient dangereux pour votre santé</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <span>Une carte interactive pour voir la situation dans votre quartier</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <span>Des conseils pratiques pour vous protéger et protéger votre famille</span>
          </li>
        </ul>
      </div>

      {/* Statistiques */}
      <div className="glass-effect rounded-2xl p-6 border border-border/50 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Notre Engagement</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">24h/24</div>
            <div className="text-xs text-muted-foreground">Surveillance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">Gratuit</div>
            <div className="text-xs text-muted-foreground">Pour Tous</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">Temps</div>
            <div className="text-xs text-muted-foreground">Réel</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">Tout</div>
            <div className="text-xs text-muted-foreground">Le Bénin</div>
          </div>
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="glass-effect rounded-2xl p-6 border border-border/50 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Comment ça marche ?</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>🌡️ <strong>Des capteurs modernes</strong> mesurent l'air en continu</p>
          <p>📡 <strong>Les données</strong> arrivent instantanément sur notre plateforme</p>
          <p>🎨 <strong>Des couleurs simples</strong> vous indiquent si l'air est bon ou dangereux</p>
          <p>📱 <strong>Accessible partout</strong> : sur votre téléphone, tablette ou ordinateur</p>
          <p>🔔 <strong>Des alertes</strong> vous préviennent en cas de danger</p>
          <p>💚 <strong>Entièrement gratuit</strong> et ouvert à tous les Béninois</p>
        </div>
      </div>
    </div>
  )
}

export function ProjectDescription() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      {/* Version colonne pour grand écran - hauteur complète de l'écran */}
      <div className="hidden lg:flex flex-col fixed right-0 top-0 w-[400px] h-screen bg-background/95 backdrop-blur-sm border-l border-border/50 z-30">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <ProjectDescriptionContent />
        </div>
      </div>

      {/* Trigger invisible pour mobile - déclenché depuis le titre */}
      <button
        data-about-trigger
        onClick={() => setIsModalOpen(true)}
        className="hidden"
        aria-hidden="true"
      />

      {/* Modal pour petit écran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-9999 lg:hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal content */}
          <div className="relative flex flex-col h-full">
            <div className="flex-1 bg-background border-l border-border/50 ml-8 overflow-y-auto p-6">
              <ProjectDescriptionContent isModal onClose={() => setIsModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  )
} 