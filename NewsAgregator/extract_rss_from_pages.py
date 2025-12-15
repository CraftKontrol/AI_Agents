#!/usr/bin/env python3
"""
Script pour extraire les flux RSS des pages de l'Atlas des flux RSS
et les ajouter au fichier rss-sources-complete.json
"""

import json
import re
from pathlib import Path

# Chemins des fichiers
SCRIPT_DIR = Path(__file__).parent
JSON_FILE = SCRIPT_DIR / "rss-sources-complete.json"

# Pages déjà fetchées avec leur contenu
PAGES_CONTENT = {
    "cuisine": """
Kite : cuisine végétale
https://kite.pixenjoy.com/en/rss-category?cat=Cuisine%20v%c3%a9g%c3%a9tale%20-%20Fr

RTBF : cuisine
https://rss.rtbf.be/article/rss/highlight_rtbf_tendance-cuisine.xml

Be : cuisine
https://www.be.com/cuisine/feed

Chef Nini
https://www.chefnini.com/feed/

Cuisine Land
https://cuisine.land/rss.xml

Healthy Alie
https://healthyalie.com/feed/

L'herboriste
https://l-herboriste.com/feed/

Menu végétarien
https://menu-vegetarien.com/feed/

Papilles à l'affût
https://papillesalaffut.com/feed/

Papilles et pupilles
http://feeds.feedburner.com/PapillesEtPupilles?format=xml

Poivreseb
http://poivreseb.fr/feed/

Quand Nad cuisine
https://quandnadcuisine.fr/feed/

Rachel Cuisine
https://rachel-cuisine.fr/feed/

Royal Chill : recettes
https://www.royalchill.com/category/recettes/feed/

Stella Cuisine
https://www.stellacuisine.com/feed/

Tangerine zest
https://tangerinezest.com/feed/

Une cuisine pour Voozenoo
https://cuisine.voozenoo.fr/feed/

Yuka
https://yuka.io/feed/

Des Elles en Cuisine
https://feed.ausha.co/yE7G7txmAzRG

La recette
https://feed.ausha.co/Zg75JI109Rlm

Radio France : cuisine
https://www.radiofrance.fr/rss/vie-quotidienne/cuisine

RTBF : Cook As You Are
https://feeds.audiomeans.fr/feed/d1385f58-9889-45b0-8859-b8de2df6e6c2.xml

RTL : L'astuce du chef
https://feeds.audiomeans.fr/feed/7145aefc-f64e-4ec0-ae62-e3c5f2f0f66a.xml

Christophe Feliciaggi : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UClpfVocAH5c20Jp041FRhvw

Chunky Cooker : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCaRlZqMG5z0QE-vMCQhI-Sw

Cuisine en folie : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCsgI5vHVdOSLqnhlwk-uHYw

Cuisine rapide : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCVbR9QKT2GHoDxCWxeC1JKw

CuisineAZ : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UC8AdLDn2gJf2sam4HJXGX3g

CuisineSimple : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCyfyGuxNX-PMFF5gcpaM2mQ

Douja Monde : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCeA3d5Cu9ITuJ4xYIbgfEfA

JustInCooking : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCtBzfGaJzGGNJVOVM0mK4uQ

L'atelier de Roxane : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UC3rxwrZSiTp6Kk2RXcyHtCA

Le Loft de Nono : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCaTGIqq4SwM9A7o600gal-Q

Mon carnivore : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCZ2ZUC9P7cg1P-jbx2_LnyQ

Nicook : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCt5zg2wrnay71DvCMQCEbGQ

Philippe Etchebest : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCO5U-JvGcz9B6ZoWvW77Tng

Recettes cooking : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UClslBJddlv0wwIKMDyAniGQ

Seizemay : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCiMbglOfIEtT4-4EY-Ruf5Q

Sohan Tricoire : peertube
https://tube.kher.nl/feeds/videos.xml?videoChannelId=1437

Un jour Une recette : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCBbVof4rmlPeIGG-rd8xD7g

Whoogy's : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCcVyMRkpb9IF1BLT3f4gRcw
""",

    "gastronomie": """
Flipboard : gastronomie
https://flipboard.com/topic/fr-gastronomie.rss

Dernières Nouvelles d'Alsace : gastronomie
https://www.dna.fr/culture-loisirs/gastronomie/rss

Euronews - FR : gastronomie
https://fr.euronews.com/rss?level=tag&name=gastronomie

France Info : cuisine et gastronomie
https://www.franceinfo.fr/culture/cuisine-et-gastronomie.rss

France3 : gastronomie
https://france3-regions.franceinfo.fr/culture/gastronomie/rss

L'Humanité : bon et sain
https://www.humanite.fr/mot-cle/bon-et-sain/feed

LaPresse : gourmand
https://www.lapresse.ca/gourmand/rss

Le NouvelObs : drinks
https://www.nouvelobs.com/drinks/rss.xml

Le Point : gastronomie
https://www.lepoint.fr/gastronomie/rss.xml

Le Temps : gastronomie et vins
https://www.letemps.ch/gastronomie-vin.rss

Midi Libre : gastronomie et terroir
https://www.midilibre.fr/culture-et-loisirs/gastronomie-et-terroir/rss.xml

Nice-Matin : gastronomie
https://www.nicematin.com/loisirs/gastronomie/rss

Sud Ouest : gastronomie
https://www.sudouest.fr/gastronomie/rss.xml

Science et avenir : nutrition
https://feeds.feedburner.com/sciencesetavenir/3TVQCdL25C1

180°C
https://www.180c.fr/feed/

Aquitaine online : gastronomie
https://www.aquitaineonline.com/actualites-en-aquitaine/feed/rss/?filter_tag[0]=2328

Malt et Houblons
https://maltsethoublons.com/feed/

Potager : bien manger
https://www.potagercaillebotte.fr/bien-manger/feed/

Sortir à Paris : food and drink
https://www.sortiraparis.com/rss/hotel-restaurant

Binouze USA
https://feed.ausha.co/aEI8E2JiB8Gk

France Inter : L'adresse de François-Régis Gaudry
https://radiofrance-podcast.net/podcast09/rss_10230.xml

ici : À table en Champagne-Ardenne
https://radiofrance-podcast.net/podcast09/rss_25294.xml

ici : Côté saveurs en Alsace
https://radiofrance-podcast.net/podcast09/rss_14884.xml

ici : Côté saveurs en Hérault - Le carnet d'adresses
https://radiofrance-podcast.net/podcast09/rss_22773.xml

ici : En Direct du Marché
https://radiofrance-podcast.net/podcast09/rss_23586.xml

ici : La team des blogueurs cuisine
https://radiofrance-podcast.net/podcast09/rss_22710.xml

ici : La Vie en Bleu, le mag
https://radiofrance-podcast.net/podcast09/rss_23461.xml

ici : Les chroniques gourmandes
https://radiofrance-podcast.net/podcast09/rss_25303.xml

Radio France : cuisine
https://www.radiofrance.fr/rss/vie-quotidienne/cuisine

C'est meilleur quand c'est bon : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UC-jfDSLvQm7DFgsBJxjE2wA

Food Story : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCzyN_JSs95aDgDFrfOxagEw

RTBF : Les étoiles du chocolat belge : youtube
https://www.youtube.com/feeds/videos.xml?playlist_id=PLThnUt_5q6GMEBIQzL8wjsG-jLqJpejHJ
""",

    "humour": """
France Info : humour
https://www.franceinfo.fr/culture/spectacles/humour.rss

Le Monde : humour
https://www.lemonde.fr/humour/rss_full.xml

Newsmada : Tir en l'air
https://newsmada.com/category/les-nouvelles/tir-en-lair/feed/

Charlie hebdo : Turquie
https://charliehebdo.fr/tag/turquie/feed/

Europe 1 : humour
https://www.europe1.fr/rss/humour.xml

A Piazzetta
https://www.apiazzetta.com/xml/syndication.rss

Le Gorafi
https://www.legorafi.fr/feed/

Nord Press
https://nordpresse.be/feed/

VDM
https://www.viedemerde.fr/rss

Les joies du code
https://lesjoiesducode.fr/feed

Le Gorafi : sports
https://www.legorafi.fr/category/sports/feed/

Une année au lycée : le monde
https://www.lemonde.fr/blog/uneanneeaulycee/feed/

France Inter : Amandine Lourdel n'a pas compris
https://radiofrance-podcast.net/podcast09/rss_24601.xml

France Inter : Le héros du jour
https://radiofrance-podcast.net/podcast09/rss_14032.xml

France Inter : Moi, ce que j'en dis...
https://radiofrance-podcast.net/podcast09/rss_23574.xml

ici : Bernadette et Jean Claude
https://radiofrance-podcast.net/podcast09/rss_14879.xml

Radio Nova : Infox, le zapping audio parodique
https://podcasts.nova.fr/radio-nova-infox-le-zapping-audio-parodique/feed/rss/website.xml

Radio Nova : La chronique d'Aymeric Lompret
https://podcasts.nova.fr/radio-nova-la-chronique-daymeric-lompret/feed/rss/website.xml

Radio Nova : La chronique de Guillaume Meurice
https://podcasts.nova.fr/radio-nova-la-chronique-de-guillaume-meurice/feed/rss/website.xml

Rire et Chansons : L'appel trop con de Martin
https://aod.nrjaudio.fm/xml/169.xml

RMC : La chronique d'Anthony Morel
https://rmc.bfmtv.com/podcast/integrale-anthony-morel/

Corse Machin : facebook
https://fetchrss.com/feed/1iIaFxGYM4cZ1jFv84GWk4cZ.rss

Djal officiel : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCEX6y7CmEYPXcZ9OfkpLGJg

France Inter : Philippe Katerine : youtube
https://www.youtube.com/feeds/videos.xml?playlist_id=PL43OynbWaTMKk8vpS9AV_JNjt_GLpZ3oz

Groland : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCJIl08OJstq_9kgI9wf_xjg

Hugo tout seul : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCXapBbZyOgvYwOlqYzf8dhg

Jigmé : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCkEa1AfdeB93-he4VziKGFg

Karine Dubernet : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UC979ZGS-n-HQ2OegaDrucZw

Le bouseuh : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCUl7mwOyySfZzUkq4H29nug

Le journal des briques : peertube
https://peertube.stream/feeds/videos.xml?videoChannelId=19755

Le rire jaune : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCTt2AnK--mnRmICnf-CCcrw

Mister V : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UC8Q0SLrZLiTj5s4qc9aad-w

Palmashow : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCoZoRz4-y6r87ptDp4Jk74g

Radio Nova : Aymeric Lompret : youtube
https://www.youtube.com/feeds/videos.xml?playlist_id=PL9wDNu3ZrVQ5iAj77ot9CnDYWnZbbcc5v

Radio Nova : Guillaume Meurice : youtube
https://www.youtube.com/feeds/videos.xml?playlist_id=PL9wDNu3ZrVQ5NtNHF1dYQa0MdB2YYWoCF

Radio Nova : La riposte : youtube
https://www.youtube.com/feeds/videos.xml?playlist_id=PL9wDNu3ZrVQ53Adh-lKaNQPNgbuZBZiqU

Radio Nova : Les chroniques des Grands Remplaçants : youtube
https://www.youtube.com/feeds/videos.xml?playlist_id=PL9wDNu3ZrVQ6fpN_H15YByUd4RPbVOgAC

Radio Nova : Les extraits de La dernière : youtube
https://www.youtube.com/feeds/videos.xml?playlist_id=PL9wDNu3ZrVQ6y2SYIfOLTgDpjSbBxi-AE

Squeezie : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCWeg2Pkate69NFdBeuRFTAw

Studio Bagel : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCZ8kV8vuMdDLSerCIFfWnFQ

Tano : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCpGbvEmVa7gZFuj-WbJeo6Q
""",

    "arts": """
Flipboard : art
https://flipboard.com/topic/fr-art.rss

Google Actu : peinture
https://news.google.com/rss/search?q=peinture&hl=fr&gl=FR&ceid=FR:fr

Le Monde : photo
https://www.lemonde.fr/photo/rss_full.xml

Art Mag
https://magazine-art-mag.fr/feed/

Arts Allagnon
https://artsallagnon.blogspot.com/feeds/posts/default?alt=rss

Beaux arts magazine
https://www.beauxarts.com/feed/

Beware Mag
https://www.bewaremag.com/feed/

Blind Magazine
https://www.blind-magazine.com/fr/feed/

Citescope : exposition
https://www.citescope.fr/themes/exposition/feed/

Connaissances des arts
https://www.connaissancedesarts.com/feed/

DesignFax
https://www.design-fax.fr/feed/

Dessins poétiques
https://rotring.over-blog.com/rss

Espace des arts
https://espacedesarts.pro/rss

Flickr : Danemark
https://api.flickr.com/services/feeds/photos_public.gne?tags=danemark

Galerie Art et Style
https://galerie-artstyle.com/feed/

Galerie Vent des Cimes
https://galerie-ventdescimes.com/feed/

L'Atelier Géant
https://lateliergeant.geant-beaux-arts.fr/feed/

L'insatiable
https://linsatiable.org/spip.php?page=backend

L'officiel
https://www.lofficiel.com/feed.rss

La galerie de Rosana
http://lagaleriederosana.blogspirit.com/index.rss

Le Grand Continent : arts
https://legrandcontinent.eu/fr/themes/arts/feed/

Le Mague
http://feeds.feedburner.com/leMague

Les murs peints s'affichent
http://feeds.feedburner.com/LesMursPeintsSaffichent?format=xml

Marc Verat
https://marcverat.blogspot.com/feeds/posts/default?alt=rss

Nikon passion
https://www.nikonpassion.com/feed/

Yann Hovadik
http://yannhovadik.blogspot.com/feeds/posts/default?alt=rss

Creapills
https://creapills.com/feed

Écouter les Beaux-Arts de Marseille !
https://feeds.transistor.fm/ecouter-les-beaux-arts-de-marseille

Actes d'Arts
https://feeds.soundcloud.com/users/soundcloud:users:978726166/sounds.rss

Brève d'art
https://feed.ausha.co/yUu2fQ82Zm7o

Décodeur
https://feed.ausha.co/y01vpFXlgq84

Innover dans le Monde de l'Art
https://feed.ausha.co/GAZ7OSvnw17l

Urban Art Paris : podcast
https://anchor.fm/s/38aece68/podcast/rss

West Indies Art Podcast
https://rss.buzzsprout.com/1971626.rss

Dessin créatif
https://art-dessincreatif.1fr1.net/rss

Flickr : Espagne
https://api.flickr.com/services/feeds/photos_public.gne?tags=espagne

Beaux-Arts de Paris : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCEARNorNgk2IeDcGjtmGwmw

Créa Lo : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UClhAN-ghjX3NTQOZoh-cG2g

Florence Morin B. : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCmk0RPWv0b-Z55Emv8yinxw

MédiART : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCYaFVZtpBB_6Zg2qN-qX6-g

Rart : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCxorIykr7tkF-BUXjTKhrrw

TutoDrawBonus : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UC7Wa-bGo-UXNbFZhgZP2BpA
""",

    "feminin": """
Actu Maroc : femme
https://actu-maroc.com/category/femme/feed/

L'Humanité : metoo
https://www.humanite.fr/mot-cle/metoo/feed

Le Monde : beauté
https://www.lemonde.fr/m-beaute/rss_full.xml

Le Monde : Les lois du genre
https://www.lemonde.fr/les-lois-du-genre/rss_full.xml

Le NouvelObs : beauté
https://www.nouvelobs.com/beaute/rss.xml

RFI : droits des femmes
https://www.rfi.fr/fr/tag/droits-des-femmes/rss

RFI : femmes
https://www.rfi.fr/fr/tag/femmes/rss

RTBF : beauté
https://rss.rtbf.be/article/rss/highlight_rtbf_tendance-beaute.xml?source=internal

Le Monde : Droit à l'avortement
https://www.lemonde.fr/droit-a-l-avortement/rss_full.xml

Axelle Magazine
https://www.axellemag.be/feed/

Les glorieuses
http://feeds.feedburner.com/LesGlorieuses

Nations Unies : femmes
https://news.un.org/feed/subscribe/fr/news/topic/women/feed/rss.xml

AngryMum : emploi
https://www.angrymum.fr/category/emploi/feed/

Au féminin
https://www.aufeminin.com/feed

Be
https://www.be.com/feed

ELLE
https://cdn-elle.ladmedia.fr/var/plain_site/storage/flux_rss/fluxToutELLEfr.xml

Femina
https://www.femina.fr/rss/content.xml

Femme Actuelle
https://www.femmeactuelle.fr/rss.xml

Journal des femmes
https://morss.it/https://www.journaldesfemmes.fr/rss/

Les confettis
https://www.lesconfettis.com/feed/

Marie France : articles
https://www.mariefrance.fr/feed/

Marie France : mode
https://www.mariefrance.fr/mode/feed

Marie-Claire
https://www.marieclaire.fr/rss/article/20001

MaxiMag : beauté
https://www.maxi-mag.fr/beaute/feed

Objeko
https://www.objeko.com/feed/

Omagazine
https://omagazine.fr/feed/

Terra Femina
https://www.terrafemina.com/partners/generic/news.xml

The Body Optimist
https://www.ma-grande-taille.com/feed

Vanity Fair France
https://www.vanityfair.fr/feed/rss

YomByYom
https://www.yombyyom.com/feed/

Àblock
https://ablock.fr/feed/

Gazette des sports : football féminin
https://gazettesports.fr/football/football-feminin/feed/

Women Sports
https://www.womensports.fr/feed

CEFCYS : Les CyberStories racontées par les femmes
https://feed.ausha.co/l22YRI0rYarJ

France Inter : En marge
https://radiofrance-podcast.net/podcast09/rss_16539.xml

France Inter : Pomme and Co
https://radiofrance-podcast.net/podcast09/rss_22776.xml

Le Figaro : Madame Figaro : conversations
https://feed.ausha.co/BngaaIzK41ro

Les Couilles sur la table
https://feeds.audiomeans.fr/feed/d9cd7538-7491-4873-b0c4-90ccba60ccf1.xml

RCFM : Beauté bien être
https://radiofrance-podcast.net/podcast09/rss_15495.xml

les sans pagEs : bluesky
https://bsky.app/profile/did:plc:kohjveomnxefysmtmyouenhi/rss

CEFCYS - CErcle des Femmes de la CYberSécurité : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCx6jwkLFV1YWdZ_7RGSQN1w

Nous Toutes : peertube
https://indymotion.fr/feeds/videos.xml?videoChannelId=1369
""",

    "people": """
20minutes : people
https://www.20minutes.fr/feeds/rss-people.xml

7sur7 : monarchies
https://www.7sur7.be/monarchies/rss.xml

7sur7 : people
https://www.7sur7.be/people/rss.xml

BFM : people
https://www.bfmtv.com/rss/people/

France Info : people
https://www.franceinfo.fr/culture/people.rss

France3 : Miss France
https://france3-regions.franceinfo.fr/culture/people/miss-france/rss

HuffPost : people
https://www.huffingtonpost.fr/people/rss_headline.xml

L'Indépendant : people
https://www.lindependant.fr/divertissement/people/rss.xml

La Dépêche : divertissement
https://www.ladepeche.fr/divertissement/rss.xml

Le Monde : Un château de sable avec...
https://www.lemonde.fr/un-chateau-de-sable-avec/rss_full.xml

Le NouvelObs : people
https://www.nouvelobs.com/people/rss.xml

Le NouvelObs tendances : people
https://o.nouvelobs.com/people/rss.xml

Le Parisien : people et medias
https://feeds.leparisien.fr/leparisien/rss/laparisienne/people

LyonMag : people
https://www.lyonmag.com/rss/category/6/people

Midi Libre : people
https://www.midilibre.fr/divertissement/people/rss.xml

Nice-Matin : people
https://www.nicematin.com/sujet/people/rss

Radio-Canada : célébrités
https://ici.radio-canada.ca/info/rss/sous-theme/celebrites

RTBF : people
https://rss.rtbf.be/article/rss/highlight_tv_people-rtbf-actualites.xml?source=internal

Barbanews
https://www.barbanews.com/feed/

Closer
https://www.closermag.fr/feed

Coin tribune : FR : people
https://www.cointribune.com/actu/actu-people/feed/

Demotivateur
https://feeds.feedburner.com/demotivateur/qATCg3PWmlW

Hollywoodpq
https://feeds.feedburner.com/hollywoodpq/TKiZ13ebxzi

Melty : célébrités
https://www.melty.fr/people/feed

Public
https://www.public.fr/feed

Stéphane Larue
https://stephanelarue.com/feed/

VSD
https://vsd.fr/feed/

ici : Génération(s) Star Academy
https://radiofrance-podcast.net/podcast09/rss_24576.xml

ici : Petite histoire des noms de stars
https://radiofrance-podcast.net/podcast09/rss_25093.xml

Le Figaro : Madame Figaro : scandales
https://feed.ausha.co/B4W44cp5eq67

Sud Info : Show Buzz
https://feeds.sudinfo.be/sudinfo/showbuzz

VSD : bluesky
https://bsky.app/profile/did:plc:i44t4mkhvzvavdj2twqzthqr/rss

Entrée libre : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCct38M-8F9JO9Fgb8KZ5ccw

Voici : youtube
https://www.youtube.com/feeds/videos.xml?channel_id=UCDfz74gMnHcckb48XzXzoGQ
"""
}

def parse_rss_sources(content_text):
    """Parse le contenu texte pour extraire les flux RSS"""
    sources = []
    lines = content_text.strip().split('\n')
    
    current_name = None
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Si la ligne est une URL (commence par http)
        if line.startswith('http'):
            if current_name:
                sources.append({
                    "name": current_name,
                    "url": line
                })
                current_name = None
        else:
            # C'est un nom de source
            current_name = line
    
    return sources

def add_sources_to_json(category_key, category_name, sources):
    """Ajoute les sources à la catégorie du fichier JSON"""
    
    # Charger le fichier JSON existant
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Créer la catégorie si elle n'existe pas
    if category_key not in data["categories"]:
        data["categories"][category_key] = {
            "name": category_name,
            "description": f"Sources {category_name.lower()}",
            "sources": []
        }
    
    # Récupérer les URLs existantes pour éviter les doublons
    existing_urls = {source["url"] for source in data["categories"][category_key]["sources"]}
    
    # Ajouter les nouvelles sources
    added_count = 0
    for source in sources:
        if source["url"] not in existing_urls:
            data["categories"][category_key]["sources"].append(source)
            existing_urls.add(source["url"])
            added_count += 1
    
    # Sauvegarder le fichier JSON mis à jour
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return added_count

def main():
    """Fonction principale"""
    
    print("Extraction des flux RSS depuis les pages de l'Atlas...")
    print("=" * 60)
    
    # Mapper les catégories
    categories_mapping = {
        "cuisine": ("cuisine", "Cuisine"),
        "gastronomie": ("gastronomie", "Gastronomie"),
        "humour": ("humour", "Humour"),
        "arts": ("arts", "Arts"),
        "feminin": ("feminin", "Féminin"),
        "people": ("people", "People")
    }
    
    total_added = 0
    
    for page_key, content in PAGES_CONTENT.items():
        category_key, category_name = categories_mapping[page_key]
        
        print(f"\n Traitement de la catégorie: {category_name}")
        sources = parse_rss_sources(content)
        print(f"  - {len(sources)} flux RSS trouvés")
        
        added = add_sources_to_json(category_key, category_name, sources)
        print(f"  - {added} nouveaux flux ajoutés")
        print(f"  - {len(sources) - added} flux déjà existants")
        
        total_added += added
    
    print("\n" + "=" * 60)
    print(f"✅ Terminé ! {total_added} nouveaux flux RSS ajoutés au total")
    print(f"📁 Fichier mis à jour: {JSON_FILE}")

if __name__ == "__main__":
    main()
