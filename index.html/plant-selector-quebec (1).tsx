import React, { useState, useMemo } from 'react';
import { Search, X, Leaf, Droplet, Sun, TreeDeciduous } from 'lucide-react';

const PlantSelector = () => {
  const [filters, setFilters] = useState({
    light: '',
    water: '',
    soilTexture: '',
    plantType: '',
    zone: '',
    function: '',
    searchText: ''
  });

  const [selectedPlant, setSelectedPlant] = useState(null);

  const plants = [
    {genre:"Acer",espece:"saccharum",nomFr:"Érable à Sucre",nomEn:"Sugar maple",zone:"3b",light:["○","◐","●"],water:["▅"],soilTexture:["▒"],forme:"A",hauteur:"15",largeur:"20",comestible:["S"],vieSauvage:"NA",floraison:["P"],notes:"Production de sirop d'érable"},
    {genre:"Achillea",espece:"millefolium",nomFr:"Achillée millefeuille",nomEn:"Yarrow",zone:"3",light:["○"],water:["▁","▅"],soilTexture:["░","▒"],forme:"H",hauteur:"0.5",largeur:"0.4",pollinisateurs:"S",couvreSol:true,medicinal:true,floraison:["É","A"],couleurFleur:["B","V"]},
    {genre:"Actaea",espece:"racemosa",nomFr:"Actée à grappes",nomEn:"Black cohosh",zone:"4",light:["◐","●"],water:["▅","█"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"0.6",largeur:"1.2",pollinisateurs:"G",medicinal:true,floraison:["É","A"],couleurFleur:["B","V"]},
    {genre:"Actinidia",espece:"arguta",nomFr:"Vigne de kiwi",nomEn:"Hardy kiwi",zone:"4",light:["○","◐"],water:["▅","█"],soilTexture:["░","▒","▓"],forme:"G",hauteur:"4",largeur:"4",comestible:["Fr"],floraison:["P"],couleurFleur:["B","V"],notes:"Dioïque - besoin mâle et femelle"},
    {genre:"Actinidia",espece:"kolomikta",nomFr:"Kiwi arctique",nomEn:"Superhardy kiwifruit",zone:"3",light:["○","◐"],water:["▅"],soilTexture:["▒","▓"],forme:"G",hauteur:"4",largeur:"4",comestible:["Fr"],floraison:["P"],couleurFleur:["B","V"],notes:"Dioïque"},
    {genre:"Agastache",espece:"foeniculum",nomFr:"Agastache fenouil",nomEn:"Anise Hyssop",zone:"4",light:["○","◐"],water:["▅"],soilTexture:["░","▒"],forme:"H",hauteur:"0.9",largeur:"0.4",pollinisateurs:"G",comestible:["Fe"],floraison:["É","A"],couleurFleur:["B","V"],notes:"Saveur d'anis"},
    {genre:"Ajuga",espece:"reptans",nomFr:"Bugle rampante",nomEn:"Carpetweed",zone:"3",light:["○","◐","●"],water:["▅","█"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"0.1",largeur:"0.2",pollinisateurs:"G",couvreSol:true,floraison:["P"],couleurFleur:["B","V"]},
    {genre:"Alchemilla",espece:"vulgaris",nomFr:"Alchémille",nomEn:"Lady's mantle",zone:"3a",light:["○","◐","●"],water:["▅","█"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"0.4",largeur:"0.3",comestible:["Fe","R"],medicinal:true,floraison:["P","É","A"],couleurFleur:["J","V"]},
    {genre:"Allium",espece:"schoenoprasum",nomFr:"Ciboulette",nomEn:"Chives",zone:"2",light:["○","◐"],water:["▅"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"0.15",largeur:"0.4",pollinisateurs:"G",comestible:["Fe","B"],floraison:["É"],couleurFleur:["M","V"]},
    {genre:"Allium",espece:"sativum",nomFr:"Ail cultivé",nomEn:"Garlic",zone:"3",light:["○"],water:["▁","▅"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"0.6",largeur:"0.2",pollinisateurs:"G",comestible:["Fl","Fe","B","Gr"],floraison:["P","É"],couleurFleur:["P","V"]},
    {genre:"Allium",espece:"tricoccum",nomFr:"Ail des bois",nomEn:"Ramps",zone:"4",light:["◐","●"],water:["▅"],soilTexture:["░","▒"],forme:"H",hauteur:"0.15",largeur:"0.25",pollinisateurs:"G",comestible:["Fe","B"],floraison:["P"],couleurFleur:["B","V"]},
    {genre:"Allium",espece:"tuberosum",nomFr:"Ciboulette à l'ail",nomEn:"Garlic chives",zone:"3",light:["○"],water:["▅"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"0.5",largeur:"0.45",pollinisateurs:"G",comestible:["Fe","B"],floraison:["P"],couleurFleur:["B","V"]},
    {genre:"Alnus",espece:"incana",nomFr:"Aulne blanc",nomEn:"Gray alder",zone:"2b",light:["○","◐"],water:["▁","▅","█"],soilTexture:["▒","▓"],forme:"A",hauteur:"15",largeur:"8",fixateurAzote:true,haie:true},
    {genre:"Amelanchier",espece:"alnifolia",nomFr:"Amélanchier",nomEn:"Saskatoon",zone:"2",light:["○","◐"],water:["▅"],soilTexture:["░","▒","▓"],forme:"Ar",hauteur:"4",largeur:"3",pollinisateurs:"G",haie:true,comestible:["Fr"],vieSauvage:"N",floraison:["P"],couleurFleur:["B","V"]},
    {genre:"Amelanchier",espece:"canadensis",nomFr:"Amélanchier du canada",nomEn:"Serviceberry",zone:"3",light:["○","◐"],water:["▅"],soilTexture:["░","▒","▓"],forme:"A",hauteur:"6",largeur:"4",pollinisateurs:"G",haie:true,comestible:["Fr"],vieSauvage:"N",floraison:["P"],couleurFleur:["B","V"]},
    {genre:"Amorpha",espece:"fruticosa",nomFr:"Faux indigo",nomEn:"False Indigo",zone:"3b",light:["○","◐"],water:["▁","▅"],soilTexture:["░","▒","▓"],forme:"Ar",hauteur:"3",largeur:"2",fixateurAzote:true,pollinisateurs:"G",haie:true,floraison:["É"],couleurFleur:["B","J","O","P","V"]},
    {genre:"Apios",espece:"americana",nomFr:"Patates en chapelet",nomEn:"Groundnut",zone:"3",light:["○","◐","●"],water:["▅","█"],soilTexture:["░","▒","▓"],forme:"G",hauteur:"1.2",largeur:"0.1",fixateurAzote:true,pollinisateurs:"G",couvreSol:true,comestible:["R"],floraison:["É","A"],couleurFleur:["P","V"]},
    {genre:"Aralia",espece:"racemosa",nomFr:"Grande salsepareille",nomEn:"Spikenard",zone:"3",light:["◐","●"],water:["▅"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"1.8",largeur:"1.2",pollinisateurs:"S",vieSauvage:"N",comestible:["Fr","R"],medicinal:true,floraison:["É"],couleurFleur:["B","V"]},
    {genre:"Arctostaphylos",espece:"uva-ursi",nomFr:"Raisin d'ours",nomEn:"Bearberry",zone:"2",light:["○"],water:["▁","▅"],soilTexture:["░","▒"],forme:"Ar",hauteur:"0.1",largeur:"1",pollinisateurs:"G",couvreSol:true,vieSauvage:"N",comestible:["Fr"],medicinal:true,floraison:["É","A"],couleurFleur:["B","Rs","V"]},
    {genre:"Armoracia",espece:"rusticana",nomFr:"Raifort",nomEn:"Horseradish",zone:"2",light:["○","◐"],water:["▅"],soilTexture:["░","▒"],forme:"H",hauteur:"0.7",largeur:"0.8",comestible:["Fe","R","G"],medicinal:true,floraison:["P","É"],couleurFleur:["B","V"]},
    {genre:"Aronia",espece:"melanocarpa",nomFr:"Aronie noire",nomEn:"Black chokeberry",zone:"3",light:["○","◐"],water:["▁","▅","█"],soilTexture:["░","▒","▓"],forme:"Ar",hauteur:"1.5",largeur:"1.5",pollinisateurs:"G",haie:true,vieSauvage:"NA",comestible:["Fr"],floraison:["P"],couleurFleur:["B","V"]},
    {genre:"Artemisia",espece:"dracunculus",nomFr:"Estragon",nomEn:"Tarragon",zone:"3",light:["○"],water:["▅"],soilTexture:["░","▒"],forme:"H",hauteur:"0.6",largeur:"0.3",pollinisateurs:"S",comestible:["Fe"],floraison:["É"],couleurFleur:["B","V"]},
    {genre:"Asarum",espece:"canadense",nomFr:"Gingembre sauvage",nomEn:"Wild ginger",zone:"3",light:["◐","●"],water:["▅"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"0.15",largeur:"0.25",couvreSol:true,comestible:["R"],medicinal:true,floraison:["P"],couleurFleur:["P","V"]},
    {genre:"Asclepias",espece:"incarnata",nomFr:"Asclépiade incarnate",nomEn:"Swamp Milkweed",zone:"3",light:["◐","●"],water:["▅","█"],soilTexture:["░","▒"],forme:"H",hauteur:"1.2",largeur:"1",pollinisateurs:"G",vieSauvage:"N",comestible:["Fl","Fr"],medicinal:true,floraison:["É"],couleurFleur:["P","V"]},
    {genre:"Asparagus",espece:"officinalis",nomFr:"Asperge",nomEn:"Asparagus",zone:"4",light:["○","◐"],water:["▁","▅"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"1.5",largeur:"0.8",pollinisateurs:"G",comestible:["T"],medicinal:true,floraison:["É"],couleurFleur:["B","V"]},
    {genre:"Baptisia",espece:"australis",nomFr:"Baptisia",nomEn:"Wild indigo",zone:"3",light:["○","◐"],water:["▁","▅"],soilTexture:["░","▒"],forme:"H",hauteur:"1",largeur:"0.6",fixateurAzote:true,pollinisateurs:"G",floraison:["É"],couleurFleur:["P","V"]},
    {genre:"Caragana",espece:"arborescens",nomFr:"Caraganier",nomEn:"Siberian pea shrub",zone:"2",light:["○"],water:["▁","▅"],soilTexture:["░","▒","▓"],forme:"Ar",hauteur:"2",largeur:"2",fixateurAzote:true,pollinisateurs:"G",vieSauvage:"N",haie:true,comestible:["Fl","G"]},
    {genre:"Comptonia",espece:"peregrina",nomFr:"Comptonie voyageuse",nomEn:"Sweetfern",zone:"2",light:["○","◐"],water:["▅","█"],soilTexture:["░"],forme:"Ar",hauteur:"0.6",largeur:"1",fixateurAzote:true,couvreSol:true},
    {genre:"Cornus",espece:"canadensis",nomFr:"Cornouiller du Canada",nomEn:"Bunchberry",zone:"2",light:["○","◐","●"],water:["▅","█"],soilTexture:["▒"],forme:"H",hauteur:"0.2",largeur:"0.3",couvreSol:true,vieSauvage:"N",haie:true,floraison:["P"],couleurFleur:["B","V"]},
    {genre:"Cornus",espece:"mas",nomFr:"Cornouiller mâle",nomEn:"Cornelian cherry",zone:"4",light:["○","◐"],water:["▅","█"],soilTexture:["░","▒","▓"],forme:"Ar",hauteur:"5",largeur:"5",pollinisateurs:"S",haie:true,vieSauvage:"N",comestible:["Fr"],medicinal:true,floraison:["P"],couleurFleur:["J","V"]},
    {genre:"Cornus",espece:"sericea",nomFr:"Cornouiller Stolonifère",nomEn:"Red-osier dogwood",zone:"2",light:["○","◐","●"],water:["▅","█"],soilTexture:["░","▒"],forme:"Ar",hauteur:"2",largeur:"3",pollinisateurs:"G",haie:true,vieSauvage:"N",comestible:["Fr"],medicinal:true,floraison:["P"],couleurFleur:["B","V"]},
    {genre:"Corylus",espece:"americana",nomFr:"Noisetier d'Amérique",nomEn:"Hazelnut",zone:"4a",light:["○","◐"],water:["▅"],soilTexture:["░","▒"],forme:"Ar",hauteur:"3",largeur:"2",accumulateur:true,pollinisateurs:"V",haie:true,vieSauvage:"A",comestible:["G"],floraison:["P"]},
    {genre:"Corylus",espece:"cornuta",nomFr:"Noisetier à long bec",nomEn:"Hazelnut",zone:"4a",light:["○","◐"],water:["▁","▅","█"],soilTexture:["░","▒","▓"],forme:"Ar",hauteur:"1.2",largeur:"1.2",accumulateur:true,pollinisateurs:"V",haie:true,vieSauvage:"N",comestible:["G"],floraison:["P"]},
    {genre:"Crambe",espece:"maritima",nomFr:"Chou maritime",nomEn:"Sea kale",zone:"5b",light:["○","◐"],water:["▁","▅","█"],soilTexture:["░","▒"],forme:"H",hauteur:"0.6",largeur:"0.6",pollinisateurs:"G",comestible:["Fe","T","Fr","R"],medicinal:true,floraison:["P"],couleurFleur:["B","V"]},
    {genre:"Crataegus",espece:"sp.",nomFr:"Aubépine",nomEn:"Hawthorne",zone:"3a",light:["○","◐"],water:["▁","▅","█"],soilTexture:["░","▒","▓"],forme:"A",hauteur:"9",largeur:"9",pollinisateurs:"S",haie:true,vieSauvage:"NA",comestible:["Fr"],floraison:["P"],couleurFleur:["Rs","V"]},
    {genre:"Elaeagnus",espece:"commutata",nomFr:"Chalef argenté",nomEn:"Silverberry",zone:"2",light:["○"],water:["▁","▅"],soilTexture:["░","▒"],forme:"Ar",hauteur:"3",largeur:"2",fixateurAzote:true,pollinisateurs:"G",haie:true,vieSauvage:"NA",comestible:["G"],medicinal:true,floraison:["É"],couleurFleur:["J"]},
    {genre:"Epilobium",espece:"angustifolium",nomFr:"Épilobe",nomEn:"Willow Herb",zone:"3",light:["○","◐"],water:["▅"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"2",largeur:"1",pollinisateurs:"G",vieSauvage:"N",comestible:["Fl","Fe","R","T","JP"],medicinal:true,floraison:["É"],couleurFleur:["Rs","V"]},
    {genre:"Fragaria",espece:"vesca",nomFr:"Fraises sauvages",nomEn:"Alpine Strawberry",zone:"3",light:["○","◐","●"],water:["▅"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"0.2",largeur:"0.2",pollinisateurs:"G",couvreSol:true,comestible:["Fr"],medicinal:true,floraison:["É","A"],couleurFleur:["B","V"]},
    {genre:"Fragaria",espece:"ananassa",nomFr:"Fraisier cultivé",nomEn:"Strawberry",zone:"3",light:["○","◐"],water:["▅"],soilTexture:["▒","▓"],forme:"H",hauteur:"0.3",largeur:"0.4",pollinisateurs:"G",couvreSol:true,comestible:["Fr"],floraison:["É","A"],couleurFleur:["B","Rs","V"]},
    {genre:"Gaultheria",espece:"procumbens",nomFr:"Thé des bois",nomEn:"Wintergreen",zone:"3",light:["◐","●"],water:["▁","▅"],soilTexture:["▒","▓"],forme:"Ar",hauteur:"0.05",largeur:"0.15",accumulateur:true,pollinisateurs:"G",couvreSol:true,vieSauvage:"N",comestible:["Fr","Fe"],medicinal:true,floraison:["É"],couleurFleur:["B"]},
    {genre:"Glechoma",espece:"hederacea",nomFr:"Lierre terrestre",nomEn:"Ground Ivy",zone:"3",light:["○","◐","●"],water:["▁","▅","█"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"0.3",largeur:"2",accumulateur:true,pollinisateurs:"G",couvreSol:true,vieSauvage:"NA",comestible:["Fl","Fr","Fe"],medicinal:true,floraison:["P"],couleurFleur:["P","V"]},
    {genre:"Helianthus",espece:"tuberosus",nomFr:"Topinambour",nomEn:"Sunchokes",zone:"4",light:["○"],water:["▁","▅"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"1.8",largeur:"0.9",pollinisateurs:"G",vieSauvage:"N",haie:true,comestible:["R"],medicinal:true,floraison:["É"],couleurFleur:["J","V"]},
    {genre:"Hippophae",espece:"rhamnoides",nomFr:"Argousier",nomEn:"Sea buckthorn",zone:"2",light:["○","◐","●"],water:["▁","▅"],soilTexture:["░","▒","▓"],forme:"Ar",hauteur:"2.5",largeur:"2.5",fixateurAzote:true,accumulateur:true,pollinisateurs:"G",haie:true,vieSauvage:"N",comestible:["Fr","Fe"],medicinal:true,floraison:["P"],couleurFleur:["J"]},
    {genre:"Lonicera",espece:"caerulea",nomFr:"Camerise",nomEn:"Haskap",zone:"2a",light:["○","◐"],water:["▅"],soilTexture:["░","▒","▓"],forme:"Ar",hauteur:"1.5",largeur:"1.5",pollinisateurs:"G",haie:true,comestible:["Fr"],floraison:["P"],couleurFleur:["B","V"]},
    {genre:"Melissa",espece:"officinalis",nomFr:"Melisse officinale",nomEn:"Lemon balm",zone:"4",light:["○","◐","●"],water:["▅"],soilTexture:["░","▒"],forme:"H",hauteur:"0.45",largeur:"0.5",accumulateur:true,pollinisateurs:"G",couvreSol:true,comestible:["Fe"],medicinal:true,floraison:["É"],couleurFleur:["B","V"]},
    {genre:"Mentha",espece:"spicata",nomFr:"Menthe verte",nomEn:"Spearmint",zone:"3",light:["○","◐"],water:["▅"],forme:"H",hauteur:"0.45",largeur:"0.4",pollinisateurs:"N",comestible:["Fe"],medicinal:true,floraison:["É"],couleurFleur:["B","Rs","V"]},
    {genre:"Monarda",espece:"didyma",nomFr:"Monarde",nomEn:"Bee balm",zone:"4",light:["○","◐"],water:["▅"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"1",largeur:"0.5",pollinisateurs:"G",comestible:["Fl"],medicinal:true,floraison:["É"],couleurFleur:["P","V"]},
    {genre:"Rubus",espece:"idaeus",nomFr:"Framboisier",nomEn:"Raspberry",zone:"2b",light:["○","◐"],water:["▅"],soilTexture:["░","▒"],forme:"Ar",hauteur:"1.5",largeur:"1.5",pollinisateurs:"G",vieSauvage:"NA",haie:true,comestible:["Fr"],floraison:["É"],couleurFleur:["B","V"]},
    {genre:"Sambucus",espece:"canadensis",nomFr:"Sureau du canada",nomEn:"Elderberry",zone:"2",light:["○","◐"],water:["▅","█"],soilTexture:["░","▒","▓"],forme:"Ar",hauteur:"3.5",largeur:"2",pollinisateurs:"S",vieSauvage:"NA",comestible:["Fr"],floraison:["É"],couleurFleur:["B","V"]},
    {genre:"Symphytum",espece:"officinale",nomFr:"Consoude",nomEn:"Comfrey",zone:"3",light:["○","◐"],water:["▅"],soilTexture:["░","▒","▓"],forme:"H",hauteur:"0.75",largeur:"1",accumulateur:true,medicinal:true,floraison:["P","É"],couleurFleur:["B","P","V"],notes:"Accumulateur de nutriments"}
  ];

  const lightOptions = {
    "○": "Plein soleil (8h+)",
    "◐": "Mi-ombre (4-8h)",
    "●": "Ombre (<4h)"
  };

  const waterOptions = {
    "▁": "Peu d'eau",
    "▅": "Eau moyenne",
    "█": "Beaucoup d'eau"
  };

  const soilOptions = {
    "░": "Sol léger",
    "▒": "Sol moyen",
    "▓": "Sol lourd"
  };

  const typeOptions = {
    "A": "Arbre",
    "Ar": "Arbuste",
    "H": "Herbacée",
    "G": "Grimpante"
  };

  const functionOptions = {
    "comestible": "Comestible",
    "medicinal": "Médicinale",
    "pollinisateurs": "Mellifère",
    "couvreSol": "Couvre-sol",
    "haie": "Haie",
    "accumulateur": "Accumulateur",
    "fixateurAzote": "Fixateur d'azote",
    "vieSauvage": "Attire faune"
  };

  const filteredPlants = useMemo(() => {
    return plants.filter(plant => {
      if (filters.light && !plant.light?.includes(filters.light)) return false;
      if (filters.water && !plant.water?.includes(filters.water)) return false;
      if (filters.soilTexture && !plant.soilTexture?.includes(filters.soilTexture)) return false;
      if (filters.plantType && plant.forme !== filters.plantType) return false;
      if (filters.zone && parseInt(plant.zone) > parseInt(filters.zone)) return false;
      
      if (filters.function) {
        if (filters.function === 'comestible' && !plant.comestible) return false;
        if (filters.function === 'medicinal' && !plant.medicinal) return false;
        if (filters.function === 'pollinisateurs' && !plant.pollinisateurs) return false;
        if (filters.function === 'couvreSol' && !plant.couvreSol) return false;
        if (filters.function === 'haie' && !plant.haie) return false;
        if (filters.function === 'accumulateur' && !plant.accumulateur) return false;
        if (filters.function === 'fixateurAzote' && !plant.fixateurAzote) return false;
        if (filters.function === 'vieSauvage' && !plant.vieSauvage) return false;
      }

      if (filters.searchText) {
        const search = filters.searchText.toLowerCase();
        return plant.nomFr.toLowerCase().includes(search) ||
               plant.nomEn.toLowerCase().includes(search) ||
               plant.genre.toLowerCase().includes(search);
      }

      return true;
    });
  }, [filters, plants]);

  const clearFilters = () => {
    setFilters({
      light: '',
      water: '',
      soilTexture: '',
      plantType: '',
      zone: '',
      function: '',
      searchText: ''
    });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Leaf className="text-green-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">
              Sélecteur de Plantes Permaculture Québec
            </h1>
          </div>
          <p className="text-gray-600 mb-6">
            Trouvez les plantes parfaites pour votre aménagement (50 plantes intégrées)
          </p>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher une plante..."
                value={filters.searchText}
                onChange={(e) => setFilters({...filters, searchText: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Sun size={16} />
                Ensoleillement
              </label>
              <select
                value={filters.light}
                onChange={(e) => setFilters({...filters, light: e.target.value})}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
              >
                <option value="">Tous</option>
                {Object.entries(lightOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Droplet size={16} />
                Besoins en eau
              </label>
              <select
                value={filters.water}
                onChange={(e) => setFilters({...filters, water: e.target.value})}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
              >
                <option value="">Tous</option>
                {Object.entries(waterOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Type de sol
              </label>
              <select
                value={filters.soilTexture}
                onChange={(e) => setFilters({...filters, soilTexture: e.target.value})}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
              >
                <option value="">Tous</option>
                {Object.entries(soilOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <TreeDeciduous size={16} />
                Type de plante
              </label>
              <select
                value={filters.plantType}
                onChange={(e) => setFilters({...filters, plantType: e.target.value})}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
              >
                <option value="">Tous</option>
                {Object.entries(typeOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Zone de rusticité (max)
              </label>
              <select
                value={filters.zone}
                onChange={(e) => setFilters({...filters, zone: e.target.value})}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
              >
                <option value="">Toutes</option>
                <option value="2">Zone 2 et moins</option>
                <option value="3">Zone 3 et moins</option>
                <option value="4">Zone 4 et moins</option>
                <option value="5">Zone 5 et moins</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Fonction
              </label>
              <select
                value={filters.function}
                onChange={(e) => setFilters({...filters, function: e.target.value})}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
              >
                <option value="">Toutes</option>
                {Object.entries(functionOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-4"
            >
              <X size={16} />
              Effacer les filtres ({activeFilterCount})
            </button>
          )}

          <div className="text-sm text-gray-600 mb-4">
            {filteredPlants.length} plante{filteredPlants.length !== 1 ? 's' : ''} trouvée{filteredPlants.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlants.map((plant, index) => (
            <div
              key={index}
              onClick={() => setSelectedPlant(plant)}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-800">{plant.nomFr}</h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Zone {plant.zone}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 italic mb-3">{plant.nomEn}</p>
              <p className="text-xs text-gray-500 mb-4">
                <em>{plant.genre} {plant.espece}</em>
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="text-gray-600">{typeOptions[plant.forme]}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Taille:</span>
                  <span className="text-gray-600">{plant.hauteur}m × {plant.largeur}m</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {plant.comestible && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    🍎 Comestible
                  </span>
                )}
                {plant.medicinal && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    💊 Médicinale
                  </span>
                )}
                {plant.pollinisateurs && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    🐝 Mellifère
                  </span>
                )}
                {plant.couvreSol && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    🌿 Couvre-sol
                  </span>
                )}
                {plant.fixateurAzote && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    🌱 Fixe azote
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredPlants.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">
              Aucune plante ne correspond à vos critères. Essayez d'ajuster vos filtres.
            </p>
          </div>
        )}

        {selectedPlant && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPlant(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {selectedPlant.nomFr}
                  </h2>
                  <p className="text-lg text-gray-600 italic">{selectedPlant.nomEn}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    <em>{selectedPlant.genre} {selectedPlant.espece}</em>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPlant(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2">Caractéristiques</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Zone:</span> {selectedPlant.zone}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {typeOptions[selectedPlant.forme]}
                    </div>
                    <div>
                      <span className="font-medium">Hauteur:</span> {selectedPlant.hauteur}m
                    </div>
                    <div>
                      <span className="font-medium">Largeur:</span> {selectedPlant.largeur}m
                    </div>
                    {selectedPlant.light && (
                      <div className="col-span-2">
                        <span className="font-medium">Lumière:</span>{' '}
                        {selectedPlant.light.map(l => lightOptions[l]).join(', ')}
                      </div>
                    )}
                    {selectedPlant.water && (
                      <div className="col-span-2">
                        <span className="font-medium">Eau:</span>{' '}
                        {selectedPlant.water.map(w => waterOptions[w]).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {selectedPlant.comestible && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2">🍎 Parties comestibles</h3>
                    <p className="text-sm text-gray-700">
                      {selectedPlant.comestible.join(', ')}
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2">Fonctions écologiques</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlant.fixateurAzote && (
                      <span className="text-xs bg-blue-200 text-blue-900 px-3 py-1 rounded-full">
                        Fixateur d'azote
                      </span>
                    )}
                    {selectedPlant.accumulateur && (
                      <span className="text-xs bg-green-200 text-green-900 px-3 py-1 rounded-full">
                        Accumulateur de nutriments
                      </span>
                    )}
                    {selectedPlant.pollinisateurs && (
                      <span className="text-xs bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full">
                        Mellifère
                      </span>
                    )}
                    {selectedPlant.vieSauvage && (
                      <span className="text-xs bg-purple-200 text-purple-900 px-3 py-1 rounded-full">
                        Attire la faune
                      </span>
                    )}
                    {selectedPlant.haie && (
                      <span className="text-xs bg-teal-200 text-teal-900 px-3 py-1 rounded-full">
                        Bon pour haie
                      </span>
                    )}
                    {selectedPlant.couvreSol && (
                      <span className="text-xs bg-lime-200 text-lime-900 px-3 py-1 rounded-full">
                        Couvre-sol
                      </span>
                    )}
                  </div>
                </div>

                {selectedPlant.notes && (
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2">📝 Notes</h3>
                    <p className="text-sm text-gray-700">{selectedPlant.notes}</p>
                  </div>
                )}

                {selectedPlant.floraison && (
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2">🌸 Floraison</h3>
                    <p className="text-sm text-gray-700">
                      Période: {selectedPlant.floraison.join(', ')}
                      {selectedPlant.couleurFleur && ` • Couleur: ${selectedPlant.couleurFleur.join(', ')}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantSelector;