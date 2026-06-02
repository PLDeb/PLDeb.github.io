#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_foundation_vascan.py
===========================
Construit une fondation de données propre et JURIDIQUEMENT INDÉPENDANTE
pour PlantExpert Québec, à partir de l'API publique VASCAN (Canadensys).

Source : Database of Vascular Plants of Canada (VASCAN)
Licence : données téléchargeables sous CC0 (domaine public),
          usage général CC-BY-SA. Attribution recommandée.
          -> https://data.canadensys.net/vascan/

Ce que le script récupère pour CHAQUE espèce (uniquement des FAITS, non
protégeables) :
  - nom latin accepté
  - nom français officiel
  - nom anglais officiel
  - habitude (arbre / arbuste / herbacée / vigne)
  - statut au Québec (indigène / introduit / etc.)
  - identifiant VASCAN (taxonID) pour traçabilité
  - source (toujours "VASCAN") pour ta colonne de provenance

Ce que le script NE FAIT PAS (et c'est volontaire) :
  - il ne copie AUCUNE description rédigée d'aucune source ;
  - tu rédigeras toi-même tes fiches (= ta valeur ajoutée et ta propriété).

Usage :
    python3 build_foundation_vascan.py
    # ou avec ta propre liste :
    python3 build_foundation_vascan.py mes_especes.txt

Sortie :
    foundation_quebec.json   (liste structurée, prête à seeder)
    foundation_quebec.csv     (même chose, tableur)
    rapport_fondation.txt     (résumé + espèces non trouvées)
"""

import json
import csv
import sys
import time
import os

try:
    import requests
except ImportError:
    sys.exit("Installe d'abord : pip install requests")

API = "https://data.canadensys.net/vascan/api/0.1/search.json"

# ── Province cible : on filtre la distribution sur le Québec (QC) ──
PROVINCE_CODE = "QC"

# ── Liste de départ : ~60 espèces pertinentes en permaculture québécoise.
#    C'est une SÉLECTION d'espèces (des noms latins = des faits).
#    Tu peux l'éditer librement, ou passer ton propre fichier en argument. ──
DEFAULT_SPECIES = [
    "Acer saccharinum", "Acer saccharum", "Alnus incana",
    "Amelanchier alnifolia", "Amelanchier canadensis", "Amelanchier laevis",
    "Amorpha fruticosa", "Arctostaphylos uva-ursi", "Aronia melanocarpa",
    "Asclepias syriaca", "Betula papyrifera", "Caragana arborescens",
    "Carya ovata", "Castanea dentata", "Ceanothus americanus",
    "Celtis occidentalis", "Cornus mas", "Cornus sericea",
    "Corylus americana", "Corylus cornuta", "Crataegus", "Cydonia oblonga",
    "Echinacea purpurea", "Elaeagnus commutata", "Gaultheria procumbens",
    "Gymnocladus dioicus", "Hamamelis virginiana", "Hippophae rhamnoides",
    "Juglans cinerea", "Juglans nigra", "Lonicera caerulea",
    "Mahonia aquifolium", "Malus", "Monarda didyma", "Morus alba",
    "Myrica gale", "Physocarpus opulifolius", "Pinus strobus",
    "Prunus americana", "Prunus pensylvanica", "Prunus virginiana",
    "Pyrus", "Quercus macrocarpa", "Quercus rubra", "Rhus typhina",
    "Ribes americanum", "Ribes nigrum", "Rosa rugosa", "Rubus idaeus",
    "Salix discolor", "Sambucus canadensis", "Shepherdia argentea",
    "Shepherdia canadensis", "Solidago canadensis", "Sorbus americana",
    "Symphytum officinale", "Tilia americana", "Vaccinium angustifolium",
    "Vaccinium corymbosum", "Vaccinium vitis-idaea", "Viburnum lentago",
    "Viburnum trilobum", "Zanthoxylum americanum",
]


def load_species(argv):
    """Charge la liste depuis un fichier (un nom latin par ligne) ou défaut."""
    if len(argv) > 1 and os.path.exists(argv[1]):
        with open(argv[1], encoding="utf-8") as f:
            names = [ln.strip() for ln in f if ln.strip() and not ln.startswith("#")]
        print(f"→ {len(names)} espèces chargées depuis {argv[1]}")
        return names
    print(f"→ Liste par défaut : {len(DEFAULT_SPECIES)} espèces")
    return DEFAULT_SPECIES


def query_vascan(names):
    """
    Interroge VASCAN par lots (POST, max 200 noms).
    L'API renvoie, pour chaque nom, une liste de 'matches' avec le taxon,
    ses noms vernaculaires et sa distribution.
    """
    results = []
    # POST permet jusqu'à 200 valeurs, séparées par des sauts de ligne.
    payload = {"q": "\n".join(names)}
    try:
        r = requests.post(API, data=payload, timeout=60)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        sys.exit(f"Erreur d'appel API : {e}\n"
                 f"Vérifie ta connexion et que {API} est accessible.")
    return data.get("results", [])


def extract(record):
    """Transforme un résultat VASCAN brut en fiche-fondation propre."""
    search_term = record.get("searchedTerm", "")
    matches = record.get("matches", [])
    if not matches:
        return None, search_term  # non trouvé

    m = matches[0]  # meilleure correspondance
    taxon = m.get("taxon", {})

    latin = taxon.get("scientificName", search_term)
    taxon_id = taxon.get("taxonID", "")
    rank = taxon.get("taxonRank", "")

    # Noms vernaculaires : on prend le préféré FR et EN
    fr = en = ""
    for v in m.get("vernacularNames", []):
        lang = v.get("language", "")
        preferred = v.get("preferredName", False)
        name = v.get("vernacularName", "")
        if lang == "fr" and (not fr or preferred):
            fr = name
        if lang == "en" and (not en or preferred):
            en = name

    # Habitude (habit) : tree / shrub / herb / vine
    habits = sorted({h.get("habit", "") for h in m.get("habits", []) if h.get("habit")})
    habit_map = {"tree": "Arbre", "shrub": "Arbuste",
                 "herb": "Herbacée", "vine": "Grimpante"}
    habit_fr = ", ".join(habit_map.get(h, h) for h in habits) if habits else "?"

    # Statut au Québec depuis la distribution
    qc_status = "?"
    for d in m.get("distribution", []):
        if d.get("locationID", "").endswith(PROVINCE_CODE) or \
           d.get("locality", "") == "Québec":
            qc_status = d.get("occurrenceStatus", "") or d.get("status", "?")
            break
    status_map = {"native": "Indigène", "introduced": "Introduit",
                  "ephemeral": "Éphémère", "extirpated": "Disparu",
                  "doubtful": "Douteux", "excluded": "Exclu", "absent": "Absent"}
    qc_status_fr = status_map.get(qc_status, qc_status)

    fiche = {
        "latin": latin,
        "nom_fr": fr,
        "nom_en": en,
        "forme": habit_fr,
        "statut_qc": qc_status_fr,
        "rang": rank,
        "vascan_id": taxon_id,
        "source": "VASCAN (Canadensys, CC0/CC-BY-SA)",
        # ── Champs à remplir TOI-MÊME (ta valeur ajoutée, ta propriété) ──
        "zone_min": None, "zone_max": None,
        "soleil": None, "humidite": None, "sol": None, "ph": None,
        "hauteur": None, "largeur": None, "croissance": None,
        "comestible": None, "medicinal": None, "mellifere": None,
        "fixe_azote": None, "brise_vent": None,
        "fonctions_perma": [],
        "description": "",   # ← à rédiger
        "notes": "",         # ← à rédiger
    }
    return fiche, None


def main():
    names = load_species(sys.argv)
    print("→ Interrogation de l'API VASCAN…")
    raw = query_vascan(names)

    fiches, manquants = [], []
    for rec in raw:
        fiche, missing = extract(rec)
        if fiche:
            fiches.append(fiche)
        elif missing:
            manquants.append(missing)

    # Tri par nom français puis latin
    fiches.sort(key=lambda f: (f["nom_fr"] or f["latin"]))

    # ── Écriture JSON ──
    with open("foundation_quebec.json", "w", encoding="utf-8") as f:
        json.dump(fiches, f, ensure_ascii=False, indent=2)

    # ── Écriture CSV ──
    if fiches:
        cols = [k for k in fiches[0].keys() if k != "fonctions_perma"]
        with open("foundation_quebec.csv", "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
            w.writeheader()
            for fi in fiches:
                w.writerow(fi)

    # ── Rapport ──
    with open("rapport_fondation.txt", "w", encoding="utf-8") as f:
        f.write("RAPPORT DE FONDATION — PlantExpert Québec\n")
        f.write("=" * 48 + "\n\n")
        f.write(f"Source : VASCAN (Canadensys) — domaine public / CC-BY-SA\n")
        f.write(f"Espèces demandées : {len(names)}\n")
        f.write(f"Fiches créées     : {len(fiches)}\n")
        f.write(f"Indigènes au QC   : {sum(1 for x in fiches if x['statut_qc']=='Indigène')}\n")
        f.write(f"Non trouvées      : {len(manquants)}\n\n")
        if manquants:
            f.write("À vérifier manuellement (orthographe / synonyme) :\n")
            for m in manquants:
                f.write(f"  - {m}\n")
        f.write("\nProchaine étape : remplir les champs zone/sol/fonctions\n")
        f.write("et rédiger tes propres descriptions (ta propriété).\n")

    print(f"\n✅ Terminé.")
    print(f"   {len(fiches)} fiches → foundation_quebec.json + .csv")
    print(f"   {len(manquants)} non trouvées (voir rapport_fondation.txt)")
    print(f"\nLes champs taxonomiques sont remplis (faits libres de droits).")
    print(f"Les champs zone/sol/fonctions/description sont VIDES :")
    print(f"c'est à toi de les remplir — c'est ce qui rend la base TIENNE.")


if __name__ == "__main__":
    main()
