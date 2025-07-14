import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  MapPin, 
  Shield, 
  TrendingUp, 
  Users, 
  Globe, 
  Bell, 
  BarChart3,
  Eye,
  Lock 
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/placeholder-logo.svg" 
                alt="AirWatch Bénin Logo" 
                width={32} 
                height={32} 
                className="h-8 w-8"
              />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AirWatch Bénin
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Connexion
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Demande d'accès
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Globe className="h-4 w-4 mr-2" />
              Surveillance Environnementale
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Surveillance de la
              <span className="text-emerald-600"> Qualité de l'Air</span>
              <br />au Bénin
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Plateforme de surveillance en temps réel de la qualité de l'air avec 
              des capteurs IoT déployés sur tout le territoire béninois.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/login">
                <Button size="lg" className="w-full sm:w-auto">
                  <Eye className="h-5 w-5 mr-2" />
                  Accéder au Dashboard
                </Button>
              </Link>
              <Link href="#fonctionnalites">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  En savoir plus
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Fonctionnalités de la Plateforme
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Des outils avancés pour surveiller et analyser la qualité de l'air
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mb-2">
                    <Activity className="h-8 w-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">Surveillance Temps Réel</CardTitle>
                  <CardDescription>
                    Données actualisées en continu depuis les capteurs IoT
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Mise à jour automatique des données</li>
                    <li>• Alertes en cas de dépassement</li>
                    <li>• Indicateurs de statut colorés</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mb-2">
                    <MapPin className="h-8 w-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">Géolocalisation</CardTitle>
                  <CardDescription>
                    Visualisation géographique des capteurs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Carte interactive des capteurs</li>
                    <li>• Coordonnées GPS précises</li>
                    <li>• Vue d'ensemble par région</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mb-2">
                    <BarChart3 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">Analyse de Données</CardTitle>
                  <CardDescription>
                    Graphiques et statistiques détaillées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Historique des mesures</li>
                    <li>• Tendances et évolutions</li>
                    <li>• Export des données CSV</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mb-2">
                    <Shield className="h-8 w-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">Sécurité & Rôles</CardTitle>
                  <CardDescription>
                    Authentification et autorisation sécurisées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Rôles Administrateur/Consultant</li>
                    <li>• Système d'invitation</li>
                    <li>• Accès contrôlé par permissions</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mb-2">
                    <Bell className="h-8 w-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">Notifications</CardTitle>
                  <CardDescription>
                    Alertes automatiques et notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Alertes seuils de pollution</li>
                    <li>• Notifications temps réel</li>
                    <li>• Rapport de statut automatique</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mb-2">
                    <TrendingUp className="h-8 w-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">Performance</CardTitle>
                  <CardDescription>
                    Interface moderne et réactive
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Next.js 15 & React 19</li>
                    <li>• Mode sombre/clair</li>
                    <li>• Design responsive mobile</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-6">
              Rejoignez la Surveillance Environnementale
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Demandez l'accès à la plateforme pour consulter les données de qualité de l'air 
              ou contactez un administrateur pour plus d'informations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  <Users className="h-5 w-5 mr-2" />
                  Demander l'accès
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white hover:text-emerald-600">
                  <Lock className="h-5 w-5 mr-2" />
                  J'ai déjà un compte
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-6 w-6 text-emerald-600" />
                  <h4 className="text-xl font-bold">AirWatch Bénin</h4>
                </div>
                <p className="text-gray-400">
                  Plateforme de surveillance de la qualité de l'air 
                  pour un environnement plus sain au Bénin.
                </p>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 AirWatch Bénin. Surveillance environnementale moderne.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 