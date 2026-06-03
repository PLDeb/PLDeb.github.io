#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Remplie les champs agronomiques de foundation_quebec.json.
Sources : PFAF, Missouri Botanical Garden, USDA PLANTS Database,
          Flore laurentienne (Marie-Victorin), Fleurbec.
"""
import json

# Format des champs :
#   zone_min / zone_max : entier USDA
#   soleil   : liste parmi ["plein soleil","mi-ombre","ombre"]
#   humidite : liste parmi ["sec","moyen","humide"]
#   sol      : liste parmi ["sableux","limoneux","argileux","tourbeux"]
#   ph       : chaîne "4.5-6.0"
#   hauteur / largeur : float mètres (valeur médiane raisonnable)
#   croissance : "lente" | "moyenne" | "rapide"
#   comestible / medicinal / mellifere / fixe_azote / brise_vent : bool
#   fonctions_perma : liste de chaînes

DATA = {
  "Acer saccharinum": {
    "zone_min":3,"zone_max":9,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen","humide"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"4.5-7.5","hauteur":20.0,"largeur":13.0,"croissance":"rapide",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["sève comestible","ombre","brise-vent","mellifère printanier"]
  },
  "Acer saccharum": {
    "zone_min":3,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen"],
    "sol":["limoneux","argileux"],
    "ph":"5.5-7.3","hauteur":22.0,"largeur":12.0,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["production de sirop","ombre","mellifère","bois noble"]
  },
  "Alnus incana": {
    "zone_min":2,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["humide"],
    "sol":["limoneux","argileux"],
    "ph":"4.5-7.5","hauteur":8.0,"largeur":4.0,"croissance":"rapide",
    "comestible":False,"medicinal":True,"mellifere":True,
    "fixe_azote":True,"brise_vent":True,
    "fonctions_perma":["fixation azote","brise-vent","haie","bord de cours d'eau","mellifère"]
  },
  "Amelanchier alnifolia": {
    "zone_min":2,"zone_max":7,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"6.0-7.0","hauteur":3.0,"largeur":2.5,"croissance":"moyenne",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","mellifère","haie","faune"]
  },
  "Amelanchier canadensis": {
    "zone_min":3,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen","humide"],
    "sol":["sableux","limoneux"],
    "ph":"5.5-7.0","hauteur":6.0,"largeur":4.0,"croissance":"moyenne",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","mellifère","haie","faune"]
  },
  "Amelanchier laevis": {
    "zone_min":4,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen"],
    "sol":["sableux","limoneux"],
    "ph":"5.5-7.0","hauteur":7.0,"largeur":5.0,"croissance":"moyenne",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","mellifère","faune"]
  },
  "Amorpha fruticosa": {
    "zone_min":4,"zone_max":9,
    "soleil":["plein soleil"],
    "humidite":["sec","moyen","humide"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"5.5-8.0","hauteur":2.5,"largeur":2.0,"croissance":"rapide",
    "comestible":False,"medicinal":False,"mellifere":True,
    "fixe_azote":True,"brise_vent":True,
    "fonctions_perma":["fixation azote","haie","brise-vent","mellifère"]
  },
  "Arctostaphylos uva-ursi": {
    "zone_min":2,"zone_max":6,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"4.5-5.5","hauteur":0.2,"largeur":1.0,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["couvre-sol","fruits comestibles","médicinal","faune"]
  },
  "Aronia melanocarpa": {
    "zone_min":3,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen","humide"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"4.5-8.0","hauteur":1.5,"largeur":1.5,"croissance":"moyenne",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","haie","mellifère","faune"]
  },
  "Asclepias syriaca": {
    "zone_min":3,"zone_max":9,
    "soleil":["plein soleil"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"5.5-7.0","hauteur":1.2,"largeur":0.7,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["mellifère","faune (monarque)","comestible","médicinal"]
  },
  "Betula papyrifera": {
    "zone_min":2,"zone_max":7,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen"],
    "sol":["sableux","limoneux"],
    "ph":"5.0-6.5","hauteur":18.0,"largeur":10.0,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["sève comestible","bois","faune","ombre","brise-vent","médicinal"]
  },
  "Caragana arborescens": {
    "zone_min":2,"zone_max":8,
    "soleil":["plein soleil"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"6.0-8.0","hauteur":4.0,"largeur":3.0,"croissance":"rapide",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":True,"brise_vent":True,
    "fonctions_perma":["fixation azote","brise-vent","haie","graines comestibles","mellifère"]
  },
  "Carya ovata": {
    "zone_min":4,"zone_max":8,
    "soleil":["plein soleil"],
    "humidite":["moyen"],
    "sol":["limoneux","argileux"],
    "ph":"5.5-7.5","hauteur":22.0,"largeur":9.0,"croissance":"lente",
    "comestible":True,"medicinal":False,"mellifere":False,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["noix comestible","faune","bois"]
  },
  "Castanea dentata": {
    "zone_min":4,"zone_max":8,
    "soleil":["plein soleil"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"4.5-6.5","hauteur":15.0,"largeur":12.0,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["châtaignes comestibles","bois","restauration écologique","mellifère"]
  },
  "Ceanothus americanus": {
    "zone_min":4,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"5.0-8.0","hauteur":0.9,"largeur":0.9,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":True,"brise_vent":False,
    "fonctions_perma":["fixation azote","mellifère","médicinal","feuilles en thé"]
  },
  "Celtis occidentalis": {
    "zone_min":3,"zone_max":9,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen","humide"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"6.0-8.0","hauteur":15.0,"largeur":15.0,"croissance":"moyenne",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["fruits comestibles","faune","ombre","brise-vent"]
  },
  "Cornus mas": {
    "zone_min":4,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen"],
    "sol":["limoneux","argileux"],
    "ph":"5.5-8.0","hauteur":6.0,"largeur":5.0,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","mellifère printanier précoce","haie","médicinal"]
  },
  "Cornus sericea": {
    "zone_min":2,"zone_max":8,
    "soleil":["plein soleil","mi-ombre","ombre"],
    "humidite":["moyen","humide"],
    "sol":["limoneux","argileux"],
    "ph":"5.5-7.5","hauteur":2.0,"largeur":3.0,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["haie","faune","bord de cours d'eau","médicinal","mellifère"]
  },
  "Corylus americana": {
    "zone_min":4,"zone_max":9,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen"],
    "sol":["sableux","limoneux"],
    "ph":"5.5-7.5","hauteur":3.0,"largeur":3.0,"croissance":"moyenne",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["noisettes comestibles","faune","haie","mellifère","accumulateur minéraux"]
  },
  "Corylus cornuta": {
    "zone_min":4,"zone_max":8,
    "soleil":["plein soleil","mi-ombre","ombre"],
    "humidite":["moyen"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"5.0-7.5","hauteur":2.5,"largeur":2.0,"croissance":"lente",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["noisettes comestibles","faune","sous-bois","haie","mellifère"]
  },
  "Crataegus": {
    "zone_min":3,"zone_max":7,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"5.5-7.5","hauteur":7.0,"largeur":6.0,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["haie défensive","fruits comestibles","médicinal cardiaque","mellifère","faune"]
  },
  "Cydonia oblonga": {
    "zone_min":5,"zone_max":9,
    "soleil":["plein soleil"],
    "humidite":["moyen"],
    "sol":["limoneux","argileux"],
    "ph":"6.0-7.5","hauteur":4.0,"largeur":4.0,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles (gelées, pâtes)","mellifère","ornement"]
  },
  "Echinacea purpurea": {
    "zone_min":3,"zone_max":9,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"6.0-7.0","hauteur":0.9,"largeur":0.5,"croissance":"moyenne",
    "comestible":False,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["médicinal immunostimulant","mellifère","faune (graines oiseaux)"]
  },
  "Elaeagnus commutata": {
    "zone_min":2,"zone_max":6,
    "soleil":["plein soleil"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"6.0-8.0","hauteur":3.0,"largeur":2.0,"croissance":"rapide",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":True,"brise_vent":True,
    "fonctions_perma":["fixation azote","brise-vent","haie","mellifère parfumé","fruits comestibles"]
  },
  "Gaultheria procumbens": {
    "zone_min":3,"zone_max":8,
    "soleil":["mi-ombre","ombre"],
    "humidite":["moyen"],
    "sol":["sableux","limoneux"],
    "ph":"4.5-6.0","hauteur":0.12,"largeur":0.4,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["couvre-sol","fruits comestibles","feuilles en thé","médicinal","sous-bois acide"]
  },
  "Gymnocladus dioicus": {
    "zone_min":3,"zone_max":8,
    "soleil":["plein soleil"],
    "humidite":["moyen"],
    "sol":["limoneux","argileux"],
    "ph":"6.0-8.0","hauteur":20.0,"largeur":12.0,"croissance":"lente",
    "comestible":False,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["ombre","brise-vent","faune","mellifère","bois durable"]
  },
  "Hamamelis virginiana": {
    "zone_min":3,"zone_max":8,
    "soleil":["plein soleil","mi-ombre","ombre"],
    "humidite":["moyen"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"5.0-6.5","hauteur":4.5,"largeur":4.5,"croissance":"lente",
    "comestible":False,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["médicinal (extrait hamamélis)","mellifère automnal","haie","ornement"]
  },
  "Hippophae rhamnoides": {
    "zone_min":3,"zone_max":7,
    "soleil":["plein soleil"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"5.5-8.0","hauteur":3.0,"largeur":3.0,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":True,"brise_vent":True,
    "fonctions_perma":["fixation azote","fruits très riches vit. C","haie défensive","brise-vent","médicinal"]
  },
  "Juglans cinerea": {
    "zone_min":3,"zone_max":7,
    "soleil":["plein soleil"],
    "humidite":["moyen"],
    "sol":["limoneux","argileux"],
    "ph":"6.0-7.0","hauteur":18.0,"largeur":13.0,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":False,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["noix comestible","bois","faune","médicinal"]
  },
  "Juglans nigra": {
    "zone_min":4,"zone_max":9,
    "soleil":["plein soleil"],
    "humidite":["moyen"],
    "sol":["limoneux","argileux"],
    "ph":"6.0-7.5","hauteur":25.0,"largeur":15.0,"croissance":"moyenne",
    "comestible":True,"medicinal":False,"mellifere":False,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["noix comestible","bois précieux","faune"]
  },
  "Lonicera caerulea": {
    "zone_min":2,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"5.5-7.0","hauteur":1.5,"largeur":1.2,"croissance":"lente",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles riches antioxydants","mellifère printanier précoce"]
  },
  "Mahonia aquifolium": {
    "zone_min":5,"zone_max":9,
    "soleil":["mi-ombre","ombre"],
    "humidite":["sec","moyen"],
    "sol":["limoneux","argileux"],
    "ph":"5.5-7.5","hauteur":1.2,"largeur":1.2,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["couvre-sol ombragé","fruits comestibles","médicinal (berbérine)","mellifère printanier"]
  },
  "Malus": {
    "zone_min":3,"zone_max":9,
    "soleil":["plein soleil"],
    "humidite":["moyen"],
    "sol":["limoneux","argileux"],
    "ph":"6.0-7.0","hauteur":6.0,"largeur":5.0,"croissance":"lente",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","mellifère","faune"]
  },
  "Monarda didyma": {
    "zone_min":4,"zone_max":9,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen","humide"],
    "sol":["limoneux"],
    "ph":"6.0-7.0","hauteur":0.9,"largeur":0.7,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["mellifère (colibris, bourdons)","médicinal","feuilles en thé","fleurs comestibles"]
  },
  "Morus alba": {
    "zone_min":4,"zone_max":8,
    "soleil":["plein soleil"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"5.5-7.0","hauteur":12.0,"largeur":12.0,"croissance":"rapide",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["fruits comestibles abondants","ombre","faune","brise-vent"]
  },
  "Myrica gale": {
    "zone_min":1,"zone_max":6,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["humide"],
    "sol":["sableux","tourbeux"],
    "ph":"4.0-6.0","hauteur":1.0,"largeur":1.5,"croissance":"lente",
    "comestible":False,"medicinal":True,"mellifere":True,
    "fixe_azote":True,"brise_vent":False,
    "fonctions_perma":["fixation azote","zones humides/tourbières","répulsif insectes","médicinal"]
  },
  "Physocarpus opulifolius": {
    "zone_min":2,"zone_max":7,
    "soleil":["plein soleil","mi-ombre","ombre"],
    "humidite":["sec","moyen","humide"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"5.5-7.5","hauteur":2.0,"largeur":2.0,"croissance":"rapide",
    "comestible":False,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["haie","brise-vent","faune","mellifère","très adaptable"]
  },
  "Pinus strobus": {
    "zone_min":3,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen"],
    "sol":["sableux","limoneux"],
    "ph":"4.5-6.5","hauteur":28.0,"largeur":8.0,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":False,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["brise-vent majeur","bois","faune","aiguilles en thé (vit. C)","ombre"]
  },
  "Prunus americana": {
    "zone_min":3,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"5.5-7.5","hauteur":3.5,"largeur":4.0,"croissance":"moyenne",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","haie","faune","mellifère"]
  },
  "Prunus pensylvanica": {
    "zone_min":2,"zone_max":7,
    "soleil":["plein soleil"],
    "humidite":["moyen"],
    "sol":["sableux","limoneux"],
    "ph":"5.0-7.0","hauteur":7.0,"largeur":5.0,"croissance":"rapide",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","faune","pionnier forestier","mellifère"]
  },
  "Prunus virginiana": {
    "zone_min":2,"zone_max":7,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"5.0-7.5","hauteur":5.0,"largeur":3.5,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles (confitures)","faune","mellifère","haie","médicinal"]
  },
  "Pyrus": {
    "zone_min":4,"zone_max":9,
    "soleil":["plein soleil"],
    "humidite":["moyen"],
    "sol":["limoneux","argileux"],
    "ph":"6.0-7.5","hauteur":8.0,"largeur":5.0,"croissance":"lente",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","mellifère"]
  },
  "Quercus macrocarpa": {
    "zone_min":3,"zone_max":8,
    "soleil":["plein soleil"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"5.5-8.0","hauteur":20.0,"largeur":20.0,"croissance":"lente",
    "comestible":True,"medicinal":False,"mellifere":False,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["glands comestibles (faible tanin)","faune","bois","ombre","brise-vent","longévité"]
  },
  "Quercus rubra": {
    "zone_min":3,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"4.5-7.0","hauteur":22.0,"largeur":17.0,"croissance":"moyenne",
    "comestible":True,"medicinal":False,"mellifere":False,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["glands (après lixiviation)","bois précieux","faune","ombre","brise-vent"]
  },
  "Rhus typhina": {
    "zone_min":3,"zone_max":8,
    "soleil":["plein soleil"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"5.0-7.5","hauteur":4.5,"largeur":4.5,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["drupes pour boisson (sumac limonade)","faune (baies hivernales)","ornement automnal","médicinal"]
  },
  "Ribes americanum": {
    "zone_min":2,"zone_max":6,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen","humide"],
    "sol":["limoneux","argileux"],
    "ph":"5.5-7.0","hauteur":1.2,"largeur":1.2,"croissance":"moyenne",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","faune","sous-bois","mellifère"]
  },
  "Ribes nigrum": {
    "zone_min":3,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen","humide"],
    "sol":["limoneux"],
    "ph":"5.5-7.0","hauteur":1.5,"largeur":1.2,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits riches vit. C","médicinal","mellifère"]
  },
  "Rosa rugosa": {
    "zone_min":2,"zone_max":7,
    "soleil":["plein soleil"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"5.5-7.0","hauteur":1.5,"largeur":1.5,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["cynorrhodons riches vit. C","haie défensive","brise-vent","mellifère","pétales comestibles"]
  },
  "Rubus idaeus": {
    "zone_min":3,"zone_max":10,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen"],
    "sol":["sableux","limoneux"],
    "ph":"5.5-6.5","hauteur":1.5,"largeur":0.7,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","mellifère","médicinal","faune"]
  },
  "Salix discolor": {
    "zone_min":2,"zone_max":8,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["humide"],
    "sol":["limoneux","argileux"],
    "ph":"5.0-8.0","hauteur":4.5,"largeur":4.0,"croissance":"rapide",
    "comestible":False,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["mellifère très précoce (printemps)","médicinal (salicine)","bord de cours d'eau","brise-vent"]
  },
  "Sambucus canadensis": {
    "zone_min":3,"zone_max":9,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen","humide"],
    "sol":["limoneux","argileux"],
    "ph":"5.5-6.5","hauteur":3.0,"largeur":2.5,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fleurs et fruits comestibles","médicinal antiviral","mellifère","faune"]
  },
  "Shepherdia argentea": {
    "zone_min":2,"zone_max":6,
    "soleil":["plein soleil"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"6.0-8.5","hauteur":3.5,"largeur":3.0,"croissance":"lente",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":True,"brise_vent":True,
    "fonctions_perma":["fixation azote","fruits comestibles","haie défensive","brise-vent","mellifère"]
  },
  "Shepherdia canadensis": {
    "zone_min":2,"zone_max":6,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux"],
    "ph":"5.5-8.0","hauteur":1.8,"largeur":1.5,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":True,"brise_vent":False,
    "fonctions_perma":["fixation azote","fruits comestibles","médicinal","mellifère"]
  },
  "Solidago canadensis": {
    "zone_min":3,"zone_max":9,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"5.0-8.0","hauteur":1.0,"largeur":0.7,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["mellifère automnal essentiel","médicinal","faune","pionnier","fleurs et feuilles comestibles"]
  },
  "Sorbus americana": {
    "zone_min":2,"zone_max":6,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen"],
    "sol":["sableux","limoneux"],
    "ph":"4.5-6.5","hauteur":7.0,"largeur":5.0,"croissance":"moyenne",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles (gelées)","faune (oiseaux)","ornement automnal","médicinal"]
  },
  "Symphytum officinale": {
    "zone_min":3,"zone_max":9,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen","humide"],
    "sol":["limoneux","argileux"],
    "ph":"5.5-7.0","hauteur":0.9,"largeur":0.7,"croissance":"rapide",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["accumulateur minéraux (K, Ca)","paillis vert","médicinal (usage externe)","mellifère"]
  },
  "Tilia americana": {
    "zone_min":2,"zone_max":8,
    "soleil":["plein soleil","mi-ombre","ombre"],
    "humidite":["moyen"],
    "sol":["limoneux","argileux"],
    "ph":"5.5-7.5","hauteur":22.0,"largeur":13.0,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":True,
    "fonctions_perma":["mellifère exceptionnelle (miel de tilleul)","tisane médicinale","ombre","brise-vent","feuilles comestibles"]
  },
  "Vaccinium angustifolium": {
    "zone_min":3,"zone_max":6,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen"],
    "sol":["sableux"],
    "ph":"4.0-5.5","hauteur":0.25,"largeur":0.6,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","couvre-sol","faune","mellifère","sol acide et pauvre"]
  },
  "Vaccinium corymbosum": {
    "zone_min":4,"zone_max":7,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen","humide"],
    "sol":["sableux","limoneux"],
    "ph":"4.5-5.5","hauteur":2.0,"largeur":1.5,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","mellifère","faune","haie","sol acide"]
  },
  "Vaccinium vitis-idaea": {
    "zone_min":2,"zone_max":6,
    "soleil":["plein soleil","mi-ombre","ombre"],
    "humidite":["moyen"],
    "sol":["sableux","tourbeux"],
    "ph":"4.0-5.5","hauteur":0.2,"largeur":0.3,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles","couvre-sol","médicinal","sol acide pauvre"]
  },
  "Viburnum lentago": {
    "zone_min":2,"zone_max":8,
    "soleil":["plein soleil","mi-ombre","ombre"],
    "humidite":["moyen","humide"],
    "sol":["limoneux","argileux"],
    "ph":"5.5-8.0","hauteur":4.5,"largeur":4.0,"croissance":"lente",
    "comestible":True,"medicinal":False,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles sucrés","haie","faune","mellifère","très adaptable"]
  },
  "Viburnum trilobum": {
    "zone_min":2,"zone_max":7,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["moyen","humide"],
    "sol":["limoneux","argileux"],
    "ph":"5.5-7.5","hauteur":3.0,"largeur":3.0,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["fruits comestibles (gelées)","haie","faune","médicinal antispasmodique","mellifère"]
  },
  "Zanthoxylum americanum": {
    "zone_min":3,"zone_max":7,
    "soleil":["plein soleil","mi-ombre"],
    "humidite":["sec","moyen"],
    "sol":["sableux","limoneux","argileux"],
    "ph":"5.5-7.5","hauteur":3.5,"largeur":3.0,"croissance":"lente",
    "comestible":True,"medicinal":True,"mellifere":True,
    "fixe_azote":False,"brise_vent":False,
    "fonctions_perma":["haie défensive (épines)","baies épice (type poivre Sichuan)","médicinal (anesthésiant)","faune"]
  },
}

# ── Application ──
with open("foundation_quebec.json", encoding="utf-8") as f:
    fiches = json.load(f)

manquants = []
for fiche in fiches:
    key = fiche["latin"]
    if key in DATA:
        fiche.update(DATA[key])
    else:
        manquants.append(key)

with open("foundation_quebec.json", "w", encoding="utf-8") as f:
    json.dump(fiches, f, ensure_ascii=False, indent=2)

print(f"✅ {len(fiches) - len(manquants)}/{len(fiches)} fiches enrichies")
if manquants:
    print(f"⚠️  Non trouvés dans DATA : {manquants}")

# Vérification rapide
import csv
with open("foundation_quebec.csv", "w", encoding="utf-8", newline="") as f:
    cols = [k for k in fiches[0].keys() if k != "fonctions_perma"]
    w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
    w.writeheader()
    for fi in fiches:
        w.writerow(fi)
print(f"✅ CSV régénéré")
