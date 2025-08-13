export default function () {
  console.log(`
    Bienvenue dans le mode Chaos !
    ----------------------------------------
    Ce mode est conçu pour tester la robustesse de votre application
    en introduisant des comportements imprévisibles et des scénarios inattendus.
    Préparez-vous à voir des logs inhabituels, des erreurs simulées,
    et des situations qui ne devraient jamais arriver en production.

    Voici quelques exemples de ce que vous pourriez rencontrer :
    - Des délais aléatoires dans les réponses réseau
    - Des données corrompues ou inattendues
    - Des exceptions levées à des moments imprévus
    - Des ressources temporairement indisponibles
    - Des messages de log très longs comme celui-ci, pour tester l'affichage

    N'oubliez pas de désactiver le mode Chaos avant de déployer en production !
    ----------------------------------------
    Merci d'utiliser le mode Chaos pour améliorer la résilience de votre application.
    Bonne chance !
  `);
}
