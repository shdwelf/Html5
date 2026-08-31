(function () {
  const STORAGE_KEY = "sitek-book-builder-project-v1";
  const SNAPSHOT_KEY = "sitek-book-builder-snapshots-v1";
  const PRIVATE_MEMO_KEY = "sitek-book-builder-private-notes-v1";
  const LOCAL_PIN_KEY = "sitek-book-builder-manual-pins-v1";
  const PHOTO_SLOT_KEY = "sitek-book-builder-photo-slots-v1";
  const CAST_TREE_KEY = "sitek-book-builder-cast-tree-v1";
  const DNA_MATCH_KEY = "sitek-book-builder-dna-matches-v1";
  const ARTIFACT_LANE_KEY = "sitek-book-builder-artifact-lane-v1";
  const PRIVATE_MILESTONE_KEY = "sitek-book-builder-private-milestones-v1";
  const GOOGLE_TIMELINE_KEY = "sitek-book-builder-google-timeline-v1";
  const FICTION_LEGEND_KEY = "sitek-book-builder-fiction-legend-v1";

  const DEFAULT_SOURCES = [
    {
      id: "src-1",
      label: "U.S. Virgin Islands Department of Justice — DOJ: Steven Thomas Greeran Wanted for Failure to Register as Sex Offender (Feb. 21, 2025)",
      url: "https://usvidoj.com/doj-steven-thomas-greeran-wanted-for-failure-to-register-as-sex-offender/",
      tier: "official"
    },
    {
      id: "src-2",
      label: "U.S. Virgin Islands Department of Justice — AG Gordon C. Rhea: Steven Thomas Greeran Arrested and Advised of His Rights for Registration Noncompliance (Feb. 28, 2025)",
      url: "https://usvidoj.com/ag-gordon-c-rhea-steven-thomas-greeran-arrested-and-advised-of-his-rights-for-registration-noncompliance/",
      tier: "official"
    },
    {
      id: "src-3",
      label: "Virgin Islands Consortium — V.I. Department of Justice Issues Arrest Warrant for Sex Offender Who Failed to Register",
      url: "https://viconsortium.com/vi-crime/virgin-islands-v-i--department-of-justice-issues-arrest-warrant-for-sex-offender-who-failed-to-register",
      tier: "reporting"
    },
    {
      id: "src-4",
      label: "Virgin Islands Free Press — Help DOJ find wanted sex offender Steven Thomas Greeran of California",
      url: "https://vifreepress.com/2025/02/help-doj-find-wanted-pedophile-steven-thomas-greeran-of-california/",
      tier: "reporting"
    },
    {
      id: "src-5",
      label: "Virgin Islands News Online — Arrest Warrant issued for Sex Offender who failed to register",
      url: "https://www.virginislandsnewsonline.com/en/news/usvi-arrest-warrant-issued-for-sex-offender-who-failed-to-register",
      tier: "reporting"
    },
    {
      id: "src-6",
      label: "St. Thomas Source — Man Arrested for Failing to Comply with Sex Offender Registration Requirements",
      url: "https://stthomassource.com/content/2025/02/28/man-arrested-for-failing-to-comply-with-sex-offender-registration-requirements/",
      tier: "reporting"
    },
    {
      id: "src-7",
      label: "St. John Source — Update: Sex Offender Wanted in USVI Now in Custody",
      url: "https://stjohnsource.com/2025/02/23/update-sex-offender-wanted-in-usvi-now-in-custody/",
      tier: "reporting"
    },
    {
      id: "src-8",
      label: "St. Croix Source — Update: Sex Offender Wanted in USVI Now in Custody",
      url: "https://stcroixsource.com/2025/02/23/update-sex-offender-wanted-in-usvi-now-in-custody/",
      tier: "reporting"
    },
    {
      id: "src-9",
      label: "Standard Resume — Steven Greeran's Resume (self-published, accessed Aug. 28, 2026)",
      url: "https://standardresume.co/r/sgreeran",
      tier: "self-published"
    },
    {
      id: "src-10",
      label: "Keybase — sgreeran (Steven Thomas Greeran) profile (self-published, accessed Aug. 28, 2026)",
      url: "https://keybase.io/sgreeran",
      tier: "self-published"
    },
    {
      id: "src-11",
      label: "Mixcloud — Steven Thomas Greeran profile (self-published, accessed Aug. 28, 2026)",
      url: "https://www.mixcloud.com/steven-thomas-greeran/",
      tier: "self-published"
    },
    {
      id: "src-12",
      label: "UCSB Cylinder Audio Archive — Project Staff / Programming-interface credit for Steven Greeran (institutional page, accessed Aug. 28, 2026)",
      url: "https://cylinders.library.ucsb.edu/contact.php",
      tier: "official"
    },
    {
      id: "src-13",
      label: "Santa Barbara County — Live Oak Camp official venue page (accessed Aug. 28, 2026)",
      url: "https://www.countyofsb.org/685/Live-Oak-Camp",
      tier: "official"
    },
    {
      id: "src-14",
      label: "UCSB Library — Geospatial Collection History / Alexandria Digital Library context (official page, accessed Aug. 28, 2026)",
      url: "https://www.library.ucsb.edu/geospatial/geospatial-collection-history",
      tier: "official"
    },
    {
      id: "src-15",
      label: "WrightwoodCalif.com — Mountain Hardware Solar Cam / Hwy 2 town context (public local page, accessed Aug. 28, 2026)",
      url: "https://www.wrightwoodcalif.com/townlive.htm",
      tier: "community"
    },
    {
      id: "src-16",
      label: "Wrightwood Communications Group KW6WW — disaster radio net and local frequencies (public local page, accessed Aug. 28, 2026)",
      url: "https://www.wrightwoodcalif.com/kw6ww/",
      tier: "community"
    },
    {
      id: "src-17",
      label: "Foodbank of Santa Barbara County — Volunteer With Us (official page, accessed Aug. 28, 2026)",
      url: "https://foodbanksbc.org/give-help/volunteer/",
      tier: "official"
    },
    {
      id: "src-18",
      label: "UCSB Library — Aerial Photography / Geospatial Collection overview (official page, accessed Aug. 28, 2026)",
      url: "https://www.library.ucsb.edu/geospatial/aerial-photography",
      tier: "official"
    },
    {
      id: "src-19",
      label: "Yumpu — SGVExaminer.com channel archive (community archive page, accessed Aug. 28, 2026)",
      url: "https://www.yumpu.com/user/sgvexaminer.com",
      tier: "community"
    },
    {
      id: "src-20",
      label: "San Gabriel Valley Examiner — Sept. 20–26, 2007 issue via Yumpu (community archive, accessed Aug. 28, 2026)",
      url: "https://www.yumpu.com/en/document/view/14579294/september-26-2007-san-gabriel-valley-examiner",
      tier: "community"
    },
    {
      id: "src-21",
      label: "San Gabriel Valley Examiner — June 5–11, 2008 issue via Yumpu (community archive, accessed Aug. 28, 2026)",
      url: "https://www.yumpu.com/en/document/view/11349959/june-11-2008-san-gabriel-valley-examiner",
      tier: "community"
    },
    {
      id: "src-22",
      label: "Citrus College Archives @Citrus — Local History Resources guide (accessed Aug. 28, 2026)",
      url: "https://libguides.citruscollege.edu/Citrus_Archives/local_history",
      tier: "official"
    },
    {
      id: "src-23",
      label: "City of Glendora — Community Archive & History (official page, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/Explore/Public-Library/Community-Archive-History",
      tier: "official"
    },
    {
      id: "src-24",
      label: "City of Glendora — eLibrary / OldGlendora community historical archive listing (official page, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/Explore/Public-Library/eLibrary",
      tier: "official"
    },
    {
      id: "src-25",
      label: "Los Angeles Times — What Is the API? (Jan. 17, 2001 archive page, accessed Aug. 28, 2026)",
      url: "https://www.latimes.com/archives/la-xpm-2001-jan-17-me-15560-story.html",
      tier: "reporting"
    },
    {
      id: "src-26",
      label: "Los Angeles Times — Academic Performance Index (Los Angeles County) (Oct. 16, 2001 archive page, accessed Aug. 28, 2026)",
      url: "https://www.latimes.com/archives/la-xpm-2001-oct-16-me-64337-story.html",
      tier: "reporting"
    },
    {
      id: "src-27",
      label: "Orange County Register — PennySaver Redux / Shopper Saver relaunch (Sept. 6, 2015, accessed Aug. 28, 2026)",
      url: "https://www.ocregister.com/2015/09/06/pennysaver-redux-ex-employees-of-defunct-advertiser-are-launching-a-new-one-in-its-image/",
      tier: "reporting"
    },
    {
      id: "src-28",
      label: "UC Santa Barbara Alumni — About / Mosher Alumni House overview (official page, accessed Aug. 28, 2026)",
      url: "https://www.alumni.ucsb.edu/about",
      tier: "official"
    },
    {
      id: "src-29",
      label: "UC Santa Barbara Alumni — History (official page, accessed Aug. 28, 2026)",
      url: "https://www.alumni.ucsb.edu/about/history",
      tier: "official"
    },
    {
      id: "src-30",
      label: "Glendora High School — Alumni / Reunions page (official school page, accessed Aug. 28, 2026)",
      url: "https://www.glendorahigh.net/apps/pages/index.jsp?uREC_ID=516311&type=d",
      tier: "official"
    },
    {
      id: "src-31",
      label: "GlendoraHighSchoolAlumni.com — Class of 2001 page / 25-year reunion invite list (community page, accessed Aug. 28, 2026)",
      url: "http://glendorahighschoolalumni.com/class-of-2001.html",
      tier: "community"
    },
    {
      id: "src-32",
      label: "Classmates — Glendora High School Class of 2001 reunion page (community page, accessed Aug. 28, 2026)",
      url: "https://www.classmates.com/reunions/glendora-high-school/class-of-2001/2595606",
      tier: "community"
    },
    {
      id: "src-33",
      label: "Glendora Natural History Website — home/introduction by Dick Swinney (community site, accessed Aug. 28, 2026)",
      url: "http://www.glendoranaturalhistory.com/",
      tier: "community"
    },
    {
      id: "src-34",
      label: "Glendora Natural History Website — Butterflies of Glendora / Big Dalton Canyon notes by Dick Swinney (community site, accessed Aug. 28, 2026)",
      url: "http://www.glendoranaturalhistory.com/Glendora_Butterflies.html",
      tier: "community"
    },
    {
      id: "src-35",
      label: "Glendora Natural History Website — Reptiles of Glendora / Big Dalton caretaker observations by Dick Swinney (community site, accessed Aug. 28, 2026)",
      url: "http://www.glendoranaturalhistory.com/Glendora_Reptiles.html",
      tier: "community"
    },
    {
      id: "src-36",
      label: "Glendora Natural History Website — The Glendora Wilderness Park Report (Jan. 1989) by Dick Swinney for Glendora Parks and Recreation (community-hosted historical document, accessed Aug. 28, 2026)",
      url: "http://www.glendoranaturalhistory.com/GWP_Rpt89.html",
      tier: "community"
    },
    {
      id: "src-37",
      label: "Glendora Natural History Website — Selected Items from Big Dalton Wilderness Park Final Report of 1978 (community-hosted historical document, accessed Aug. 28, 2026)",
      url: "http://www.glendoranaturalhistory.com/BDWP_FnlRpt78_Selected%20Items.html",
      tier: "community"
    },
    {
      id: "src-38",
      label: "City of Glendora — Trails / Big Dalton Canyon Wilderness Area features including day camp facilities and Girl Scout Hut (official page, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/Explore/Recreation/Trails",
      tier: "official"
    },
    {
      id: "src-39",
      label: "City of Glendora — Big Dalton Wilderness Area & Rowley Amphitheater / campground history (official page, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/Explore/Field-and-Facility-Rentals/Big-Dalton-Wilderness-Area-Rowley-Amphitheater",
      tier: "official"
    },
    {
      id: "src-40",
      label: "Glendora Historical Society — Creation of the Glendora Historical Society Museum / H. Paul Keiser history (community history page, accessed Aug. 28, 2026)",
      url: "https://www.glendorahistoricalsociety.org/founding/",
      tier: "community"
    },
    {
      id: "src-41",
      label: "Glendora Public Library — Community Archive search portal (official library archive, accessed Aug. 28, 2026)",
      url: "https://glendora.historyarchives.online/",
      tier: "official"
    },
    {
      id: "src-42",
      label: "Glendora History Q & A — Public Library address/person/building help page (official city-hosted engagement page, accessed Aug. 28, 2026)",
      url: "https://www.engageglendora.com/glendorahistoryqanda",
      tier: "official"
    },
    {
      id: "src-43",
      label: "MyGlendora / Glendora Mapping Solutions — address and parcel lookup hub (official GIS page, accessed Aug. 28, 2026)",
      url: "https://gishub.cityofglendora.org/",
      tier: "official"
    },
    {
      id: "src-44",
      label: "City of Glendora — Water Billing page with 2026 Water Rates Zone Map link (official page, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/Services/Water/Water-Billing",
      tier: "official"
    },
    {
      id: "src-45",
      label: "City of Glendora Community Plan 2025 — Conservation Element / water supply and service (official planning document, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/files/assets/city/v/1/community-development/planning-division/documents/general-plan-and-zoning/chapter-8-conservationelement.pdf",
      tier: "official"
    },
    {
      id: "src-46",
      label: "City of Glendora — Active Project List including Rock House-Big Dalton Canyon (official project list, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/files/assets/city/v/1/public-works/documents/29may2024_active-cip-project-list.pdf",
      tier: "official"
    },
    {
      id: "src-47",
      label: "City of Glendora — Big Dalton Wilderness Area trail map including Wren-Meacham Trail (official PDF, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/files/content/city/v/14/explore/recreation/trails/big-dalton-trail-sign.pdf",
      tier: "official"
    },
    {
      id: "src-48",
      label: "City of Glendora — 2025–2027 City Council Goals + Action Plan / annexation-study item (official strategic plan, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/files/assets/city/v/1/city-manager/strategic-plan/2025-2027-two-year-strategic-plan.pdf",
      tier: "official"
    },
    {
      id: "src-49",
      label: "Dhammakaya International Meditation Center, Azusa — Our History page (official site, accessed Aug. 28, 2026)",
      url: "https://www.dimc.info/our-history",
      tier: "official"
    },
    {
      id: "src-50",
      label: "City of Azusa — Notice of Public Hearing for Dhammakaya Specific Plan at 865 E. Monrovia Place (official record, accessed Aug. 28, 2026)",
      url: "https://www.azusaca.gov/DocumentCenter/View/30395/15-11-Dhammakaya-Public-Hearing",
      tier: "official"
    },
    {
      id: "src-51",
      label: "City of Azusa — Dhammakaya International Meditation Center Executive Summary / site and parcel context (official CEQA document, accessed Aug. 28, 2026)",
      url: "https://www.azusaca.gov/DocumentCenter/View/29550/20-Executive-Summary?bidId=",
      tier: "official"
    },
    {
      id: "src-52",
      label: "Glendora Natural History Website — Wren Meacham Trail dedication page / Ida Meacham 99-year lease recollection (community historical page, accessed Aug. 28, 2026)",
      url: "http://www.glendoranaturalhistory.com/Glendora_Wren_Meachum_Trail.html",
      tier: "community"
    },
    {
      id: "src-53",
      label: "City of Glendora — General Plan Land Use Map showing Sphere of Influence and City Limits (official map, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/files/assets/city/v/1/community-development/planning-division/documents/general-plan-and-zoning/general-plan-rev.-feb-2023.pdf",
      tier: "official"
    },
    {
      id: "src-54",
      label: "USDA Forest Service — San Dimas Experimental Forest / Tanbark Flats overview (official site, accessed Aug. 28, 2026)",
      url: "https://www.fs.usda.gov/psw/ef/san_dimas/",
      tier: "official"
    },
    {
      id: "src-55",
      label: "Mt. San Antonio College — Horticulture & Park Management program overview (official college page, accessed Aug. 28, 2026)",
      url: "https://www.mtsac.edu/horticulture/about.html",
      tier: "official"
    },
    {
      id: "src-56",
      label: "Los Angeles County Assessor — Parcel detail for 1803 Big Dalton Canyon Rd / AIN 8636-036-272 (official parcel page, accessed Aug. 28, 2026)",
      url: "https://portal.assessor.lacounty.gov/parceldetail/8636036272",
      tier: "official"
    },
    {
      id: "src-57",
      label: "Los Angeles County Assessor — Parcel detail for 2041 Big Dalton Canyon Rd / AIN 8636-026-272 (official parcel page, accessed Aug. 28, 2026)",
      url: "https://portal.assessor.lacounty.gov/parceldetail/8636026272",
      tier: "official"
    },
    {
      id: "src-58",
      label: "Los Angeles County Assessor parcel layer — active situs query for Big Dalton Canyon Rd addresses (official GIS service query, accessed Aug. 28, 2026)",
      url: "https://cache.gis.lacounty.gov/cache/rest/services/LACounty_Cache/LACounty_Parcel/MapServer/0/query?where=SitusStreet%20%3D%20%27BIG%20DALTON%20CANYON%20RD%27&outFields=AIN,APN,SitusHouseNo,SitusStreet,SitusFullAddress,SitusCity,TaxRateArea,TaxRateCity,UseType,UseDescription,YearBuilt1,Bedrooms1,Bathrooms1,SQFTmain1,AgencyName,AgencyType&returnGeometry=false&resultRecordCount=50&orderByFields=SitusHouseNo&f=pjson",
      tier: "official"
    },
    {
      id: "src-59",
      label: "LA County Permitting (EPIC-LA Case History) — Big Dalton Canyon Road address query (official GIS service query, accessed Aug. 28, 2026)",
      url: "https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/EPIC-LA_Case_History_view/FeatureServer/0/query?where=MAIN_ADDRESS%20like%20%27%25Big%20Dalton%20Canyon%20Road%25%27&outFields=CASENUMBER,STATUS,DESCRIPTION,MAIN_ADDRESS,MAIN_AIN,APPLY_DATE,PROJECTNAME,CASENAME,WORKCLASS_NAME,COUNTYWIDE_STAT_AREA&returnGeometry=false&resultRecordCount=50&orderByFields=MAIN_ADDRESS&f=pjson",
      tier: "official"
    },
    {
      id: "src-60",
      label: "Los Angeles County Public Works — Glendora Easterly Annexation District No. 77 (GLNDR0204) PDF (official annexation record, accessed Aug. 28, 2026)",
      url: "https://pwgis.blob.core.windows.net/smpm/SMPM_AnnexationCity/GLNDR0204.pdf",
      tier: "official"
    },
    {
      id: "src-61",
      label: "Los Angeles County legal city-boundary layer — point query showing 1803 Big Dalton area in Unincorporated County (official GIS service query, accessed Aug. 28, 2026)",
      url: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/19/query?geometry=-13116959.3168%2C4049957.9746&geometryType=esriGeometryPoint&inSR=102100&spatialRel=esriSpatialRelIntersects&outFields=CITY_LABEL,CITY_TYPE,CITY_NAME,FEAT_TYPE&returnGeometry=false&f=pjson",
      tier: "official"
    },
    {
      id: "src-62",
      label: "Los Angeles County legal city-boundary layer — point query showing nearby 1800 Big Dalton area in Glendora (official GIS service query, accessed Aug. 28, 2026)",
      url: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/19/query?geometry=-13116794.9457%2C4049941.0615&geometryType=esriGeometryPoint&inSR=102100&spatialRel=esriSpatialRelIntersects&outFields=CITY_LABEL,CITY_TYPE,CITY_NAME,FEAT_TYPE&returnGeometry=false&f=pjson",
      tier: "official"
    },
    {
      id: "src-63",
      label: "The Original Renaissance Pleasure Faire — official Faire history page (accessed Aug. 28, 2026)",
      url: "https://renfair.com/socal/the-faire/",
      tier: "official"
    },
    {
      id: "src-64",
      label: "National Park Service — Paramount Ranch / Agoura Hills official site page (accessed Aug. 28, 2026)",
      url: "https://www.nps.gov/samo/planyourvisit/paramountranch.htm",
      tier: "official"
    },
    {
      id: "src-65",
      label: "City of Glendora — Fiscal Year 2016-2017 Adopted Budget (official city budget PDF, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/files/assets/city/v/1/finance/documents/budgets-amp-reports/2016_17_adoptedbudget_compresse.pdf",
      tier: "official"
    },
    {
      id: "src-66",
      label: "LA County Public Works — Sediment Strategic Plan / Big Dalton Reservoir section (official county document, accessed Aug. 28, 2026)",
      url: "https://pw.lacounty.gov/core-service-areas/uploads/2024/08/Sediment-Strategic-Plan-422.pdf",
      tier: "official"
    },
    {
      id: "src-67",
      label: "City of Glendora — Facility Documents / citywide Facility Condition Assessment page (official city page, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/City-Hall/Facility-Documents",
      tier: "official"
    },
    {
      id: "src-68",
      label: "City of Glendora — Big Dalton Canyon Girl Scout Cabin Facility Condition Assessment (official city PDF, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/files/assets/city/v/1/city-manager/facility-condition-index/fca-assessments/big-dalton-canyon-girl-scout-cabin.pdf",
      tier: "official"
    },
    {
      id: "src-69",
      label: "City of Glendora — Big Dalton Canyon Park Campground Facility Condition Assessment (official city PDF, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/files/assets/city/v/1/city-manager/facility-condition-index/fca-assessments/big-dalton-canyon-park-campground.pdf",
      tier: "official"
    },
    {
      id: "src-70",
      label: "City of Glendora — Big Dalton Garage-Residences / Rock House Facility Condition Assessment (official city PDF, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/files/assets/city/v/1/city-manager/facility-condition-index/fca-assessments/big-dalton-garage-residences.pdf",
      tier: "official"
    },
    {
      id: "src-71",
      label: "City of Glendora — Big Dalton Canyon Park Daycamp-Restrooms Facility Condition Assessment (official city PDF, accessed Aug. 28, 2026)",
      url: "https://www.cityofglendora.gov/files/assets/city/v/1/city-manager/facility-condition-index/fca-assessments/big-dalton-canyon-park-daycamp-restrooms.pdf",
      tier: "official"
    },
    {
      id: "src-72",
      label: "CEQAnet — Dalton Canyon Walking Trail / City of Glendora filing with parcel numbers 8636036272 and 8636026272 (official state planning record, accessed Aug. 28, 2026)",
      url: "https://ceqanet.lci.ca.gov/2012101089",
      tier: "official"
    },
    {
      id: "src-73",
      label: "City of Pasadena — Welcome to the Arroyo Seco (official city page, accessed Aug. 28, 2026)",
      url: "https://www.cityofpasadena.net/parks-and-rec/arroyo-seco/",
      tier: "official"
    },
    {
      id: "src-74",
      label: "NAVFAC — Former Naval Command, Control, and Ocean Surveillance Center Morris Dam history page (official U.S. Navy page, accessed Aug. 28, 2026)",
      url: "https://www.navfac.navy.mil/Divisions/Environmental/Products-and-Services/Environmental-Restoration/Southwest/Morris-Dam-NCCOSC/",
      tier: "official"
    },
    {
      id: "src-75",
      label: "NAVFAC — Former NCCOSC Morris Dam Site Descriptions (official U.S. Navy page, accessed Aug. 28, 2026)",
      url: "https://www.navfac.navy.mil/Divisions/Environmental/Products-and-Services/Environmental-Restoration/Southwest/Morris-Dam-NCCOSC/Site-Descriptions/",
      tier: "official"
    },
    {
      id: "src-76",
      label: "U.S. EPA — AEROJET ELECTROSYSTEMS CO. Superfund site information for 1100 W Hollyvale St, Azusa (official EPA page, accessed Aug. 28, 2026)",
      url: "https://cumulis.epa.gov/supercpad/cursites/csitinfo.cfm?id=0901610",
      tier: "official"
    },
    {
      id: "src-77",
      label: "Library of Congress — HAER catalog item for Variable Angle Launcher Complex / Morris Dam Test Facility, Morris Reservoir, Azusa (official catalog page, accessed Aug. 28, 2026; direct retrieval blocked in this environment)",
      url: "https://www.loc.gov/item/ca2094/",
      tier: "official"
    },
    {
      id: "src-78",
      label: "Goddard Middle School — 2022-2023 handbook section on Science Camps and Moka Sister City (official school PDF, accessed Aug. 28, 2026)",
      url: "https://www.goddardtitans.net/pdfs/Parent%20and%20Student%20Handbook/GMS%20handbook%202022_2023%20final%20_1_.pdf",
      tier: "official"
    },
    {
      id: "src-79",
      label: "Consulate-General of Japan in Los Angeles — Sister Cities list showing Glendora–Moka relationship established in 1988 (official consular page, accessed Aug. 28, 2026)",
      url: "https://www.la.us.emb-japan.go.jp/itpr_en/sistercitylist.htm",
      tier: "official"
    },
    {
      id: "src-80",
      label: "Catalina Island Marine Institute — Cherry Cove 3-Day Program Planner (official camp PDF, accessed Aug. 28, 2026)",
      url: "https://cimi.org/wp-content/uploads/2022/03/Cherry-3-Day-Program-Planner-S2020.pdf",
      tier: "official"
    },
    {
      id: "src-81",
      label: "AstroCamp — Getting to AstroCamp / Idyllwild location page (official camp page, accessed Aug. 28, 2026)",
      url: "https://astrocamp.org/travel/",
      tier: "official"
    },
    {
      id: "src-82",
      label: "Los Angeles County Office of Education — Outdoor Marine Field Study / Wrightwood Outdoor Science School overview (official LACOE page, accessed Aug. 28, 2026)",
      url: "https://www.lacoe.edu/services/curriculum-instruction/stem-science/marine-field-study",
      tier: "official"
    },
    {
      id: "src-83",
      label: "Glendora Unified School District — GATE Eligibility / district gifted-program page (official district page, accessed Aug. 28, 2026)",
      url: "https://www.glendora.k12.ca.us/apps/pages/index.jsp?uREC_ID=516187&type=d&termREC_ID=&pREC_ID=990710",
      tier: "official"
    },
    {
      id: "src-84",
      label: "Glendora Unified School District — Our Schools directory including Sellers Elementary School at 500 N. Loraine Ave. (official district page, accessed Aug. 28, 2026)",
      url: "https://www.glendora.k12.ca.us/apps/pages/index.jsp?uREC_ID=536204&type=d",
      tier: "official"
    },
    {
      id: "src-85",
      label: "California Highway Patrol — CHP Traffic Incident Information Page / CAD current-incident feed (official CHP page, accessed Aug. 28, 2026)",
      url: "https://cad.chp.ca.gov/",
      tier: "official"
    },
    {
      id: "src-86",
      label: "CEQAnet — Big Dalton Dam Rehabilitation Project on parcel 8678-012-902 (official state planning record, accessed Aug. 28, 2026)",
      url: "https://ceqanet.lci.ca.gov/1997071053",
      tier: "official"
    },
    {
      id: "src-87",
      label: "Library of Congress / HAER — Big Dalton Dam index to photographs naming 2600 Big Dalton Canyon Road (official LOC PDF, accessed Aug. 28, 2026)",
      url: "https://tile.loc.gov/storage-services/master/pnp/habshaer/ca/ca2500/ca2546/data/ca2546cap.pdf",
      tier: "official"
    },
    {
      id: "src-88",
      label: "AEG Worldwide — Amgen Tour of California 2019 route announcement including the Ontario-to-Mt. Baldy stage through Glendora and Glendora Mountain Road (official organizer press release, accessed Aug. 28, 2026)",
      url: "https://aegworldwide.com/press-center/press-releases/amgen-tour-california-2019-route-revealed-announcement-presented-visit",
      tier: "official"
    },
    {
      id: "src-89",
      label: "U.S. Geological Survey Water Data — LITTLE DALTON C NR GLENDORA CA, site 11086500 (official USGS monitoring page, accessed Aug. 28, 2026)",
      url: "https://waterdata.usgs.gov/monitoring-location/USGS-11086500/",
      tier: "official"
    }
  ];

  const RESEARCH_PLACES = [
    {
      id: "pasadena-private",
      name: "Pasadena, California",
      lat: 34.1478,
      lon: -118.1445,
      lane: "private",
      source: "local-only",
      exportable: false,
      summary: "Local-only origin marker from a user-supplied private recollection. Exact hospital, date, birth weight, and family details are intentionally kept out of the public/exported edition unless you choose to publish them yourself."
    },
    {
      id: "glendora",
      name: "Glendora, California",
      lat: 34.1361,
      lon: -117.8653,
      lane: "self-published",
      source: "src-9, src-20, src-21, src-22, src-23, src-24, src-25, src-26, src-27, src-30, src-31, src-32, src-33, src-34, src-35, src-36, src-37, src-38, src-39, src-40, src-41, src-42, src-43, src-44, src-45, src-46, src-47, src-48, src-52, src-53, src-65, src-66, src-67, src-68, src-69, src-70, src-71, src-72, src-78, src-79",
      exportable: true,
      summary: "The self-published resume links Greeran to Glendora High School, city recreation service, fundraising, and local references. Community-archive SGV Examiner issues add Glendora setting, Citrus College and the City of Glendora point to searchable local-history collections including the Glendoran and school yearbooks, Los Angeles Times API tables place Glendora High at 743 in 2000 and 754 in 2001, later Orange County Register reporting shows PennySaver as a familiar regional advertising circular with Glendora business use, and both official school reunion pages and community alumni pages show active alumni/reunion infrastructure for Glendora High. A newer Big Dalton pass adds Dick Swinney's Glendora natural-history corpus, a butterfly page tying E. R. Hulbirt's canyon collecting to H. Paul Keiser at Big Dalton Dam, a reptile page that names Dick Strahan and Kevin Sweeney as later Big Dalton Dam caretakers, historical park reports describing the Hawks-family rock house, Girl Scout/Salyer nature-center context, and city purchase of leased canyon homes, plus current City trails pages that still list day camp facilities and a Girl Scout Hut. An official-records pass adds the Glendora Public Library archive portal, the city library's History Q & A page for address/person/building questions, MyGlendora parcel lookup, the Water Billing / 2026 Water Rates Zone Map path, Conservation Element service-area data, a current Rock House-Big Dalton Canyon capital-project listing, an official Wren-Meacham trail map, current city-limit / sphere-of-influence mapping, a 2016-17 city-budget note about staffing to care for the Big Dalton property, county reservoir-management text showing official operations framing but still no direct caretaker-house record, and a 2024 city facility-assessment set that separately inventories the Girl Scout Cabin, Campground, Daycamp-Restrooms, and Garage-Residences / Rock House. That new facility set officially confirms a 1970 Girl Scout Cabin, a 1950 day-camp complex at 2041 Big Dalton Canyon Road, and a 1934-1936 Rock House / garage-residences property that was formerly residential and is planned for Parks Department office reuse. A further county-records pass now shows that the active LA County parcel layer exposes only four current Big Dalton Canyon Road situs entries — 1800 (two government parcels on the Glendora side), 1803 (a government-owned camp parcel with a 1934 1,405-square-foot two-bed/two-bath improvement), and 2041 (an unincorporated government parcel) — while EPIC-LA permit records also use 1821 and 2041 under the same AIN 8636026272, suggesting a right-of-way or access-use address rather than a separate residential parcel. A 2012 CEQAnet Dalton Canyon Walking Trail filing by the City of Glendora also lists parcels 8636036272 and 8636026272 together for recreational trail development under Conservation Open Space and Los Angeles County overlay land-use language. Nearby 1800 ties to Glendora's official Easterly Annexation District No. 77, while 1803 remains in unincorporated county GIS, 2600 now appears separately in official permit and Library of Congress dam records, and 2860 still does not appear as a current active situs in the county parcel layer. Together these strengthen the picture of mixed city-ownership, wilderness-land, residence reuse, water-service, and boundary conditions in Big Dalton Canyon, while official Goddard materials and the Japan consulate's sister-cities list also confirm that Glendora maintained a long-running Moka sister-school exchange and middle-school science-camp framework in the same broader local orbit. Even so, those institutional sources still do not independently prove the user's exact residency chronology, exchange participation, or family-specific recollections, and no direct official Ida Meacham page or official 2860 record was recovered in this pass. [9][20][21][22][23][24][25][26][27][30][31][32][33][34][35][36][37][38][39][40][41][42][43][44][45][46][47][48][52][53][56][57][58][59][60][61][62][65][66][67][68][69][70][71][72][78][79]"
    },
    {
      id: "duarte",
      name: "Duarte, California",
      lat: 34.1395,
      lon: -117.9773,
      lane: "self-published",
      source: "src-9",
      exportable: true,
      summary: "A canned-food-drive project linked to Access Duarte appears on the self-published resume. [9]"
    },
    {
      id: "sellers-elementary",
      name: "Sellers Elementary School, Glendora, California",
      lat: 34.1436,
      lon: -117.8836,
      lane: "official",
      source: "src-83, src-84",
      exportable: true,
      summary: "Current Glendora Unified sources show a district GATE program and list Sellers Elementary School at 500 N. Loraine Ave. in Glendora. This gives official public context for later local-only recollections about Sellers, GATE, and school-computer-lab activity, but it does not by itself prove a specific student's placement or a family member's employment. [83][84]"
    },
    {
      id: "san-dimas",
      name: "San Dimas, California",
      lat: 34.1067,
      lon: -117.8067,
      lane: "self-published",
      source: "src-9",
      exportable: true,
      summary: "Volunteer health-care listings on the self-published resume include San Dimas-associated facilities. [9]"
    },
    {
      id: "san-dimas-experimental-forest",
      name: "San Dimas Experimental Forest / Tanbark Flats, California",
      lat: 34.2,
      lon: -117.75,
      lane: "official",
      source: "src-54, src-55",
      exportable: true,
      summary: "Official USDA Forest Service material describes the San Dimas Experimental Forest as a long-running Angeles National Forest research preserve whose facilities at Tanbark Flats include a laboratory or office, residences, and support buildings. Mt. San Antonio College's Horticulture & Park Management pages separately confirm a long-running regional horticulture program, which makes the forest and Mt. SAC a useful public context pair for future local-only horticulture recollections without independently verifying any family-specific story. [54][55]"
    },
    {
      id: "pomona", 
      name: "Pomona / Cal Poly Pomona, California",
      lat: 34.0551,
      lon: -117.7490,
      lane: "self-published",
      source: "src-9",
      exportable: true,
      summary: "The self-published resume lists summer coursework at Cal Poly Pomona and Pomona-area volunteering. [9]"
    },
    {
      id: "goleta",
      name: "Goleta, California",
      lat: 34.4358,
      lon: -119.8276,
      lane: "self-published",
      source: "src-9",
      exportable: true,
      summary: "The self-published resume places Greeran at Rat Races for the Santa Barbara Renaissance Pleasure Faire at Live Oak Camp in Goleta, including staying in character and maintaining period dress; Santa Barbara County publicly identifies Live Oak Camp as a real venue. [9][13]"
    },
    {
      id: "paramount-ranch",
      name: "Paramount Ranch / Agoura Hills, California",
      lat: 34.1181,
      lon: -118.7525,
      lane: "official",
      source: "src-63, src-64",
      exportable: true,
      summary: "The Original Renaissance Pleasure Faire's official history says the Southern California fair began in 1963 in Agoura, near Malibu, while the National Park Service places Paramount Ranch at 2903 Cornell Road in Agoura Hills and documents its long film history. Together they provide strong public place context for later local-only memories involving Agoura, Paramount Ranch, and early Renaissance Faire social ties, without independently proving any specific family or relationship recollection. [63][64]"
    },
    {
      id: "glen-helen-devore",
      name: "Glen Helen / Devore, California",
      lat: 34.2209,
      lon: -117.42,
      lane: "official",
      source: "src-63",
      exportable: true,
      summary: "The Original Renaissance Pleasure Faire's official history says the Southern California fair later spent many years at the Glen Helen Pavilion in Devore before moving again. This gives clean public place context for later local-only Glen Helen camping or festival recollections without verifying companion details by itself. [63]"
    },
    {
      id: "freedom-acres-private",
      name: "Freedom Acres / former Deer Park lead, San Bernardino County",
      lat: 34.2209,
      lon: -117.42,
      lane: "private",
      source: "local-only",
      exportable: false,
      summary: "Local-only place lead from user recollection: earlier Deer Park nudist-resort history and the later Freedom Acres site across from Glen Helen are remembered as part of the user's Southern California faire/campground orbit. Keep private until independently documented."
    },
    {
      id: "lakewood-co-private",
      name: "Lakewood, Colorado",
      lat: 39.7047,
      lon: -105.0814,
      lane: "private",
      source: "local-only",
      exportable: false,
      summary: "Local-only place lead from user recollection: stayed with Mara Grace Octal in a \"Radeon basement\" in Lakewood, Colorado. Keep private until independently documented or intentionally published."
    },
    {
      id: "glendora-home-computing-private",
      name: "Glendora home-computing / dial-up memory",
      lat: 34.1361,
      lon: -117.8653,
      lane: "private",
      source: "local-only",
      exportable: false,
      summary: "Local-only place lead from user recollection: home-computing and dial-up era involving Prodigy Classic, later dial-up and modem services, account handles, and pager-era internet access in Glendora. Keep private until independently documented or intentionally published."
    },
    {
      id: "santa-barbara", 
      name: "Santa Barbara / UCSB, California",
      lat: 34.4208,
      lon: -119.6982,
      lane: "self-published",
      source: "src-9, src-12, src-14, src-17, src-18, src-28, src-29",
      exportable: true,
      summary: "The self-published resume places Greeran at UCSB and in Santa Barbara-area library, food-bank, and botanic-garden work; UCSB officially documents the Alexandria Digital Library / Map & Imagery Lab context, the Cylinder Audio Archive credits Steven Greeran on its programming/interface staff page, the Geospatial Collection publicly describes one of the country's largest academic map and aerial-photo collections, the UCSB Alumni site describes Mosher Alumni House on Mesa Road as a central alumni facility, and the alumni-history page traces organized alumni activity back to 1919 and says Mosher Alumni House and All Gaucho Reunion launched in 2007. The Foodbank of Santa Barbara County also publicly confirms current South County volunteer operations in Santa Barbara and Goleta. [9][12][14][17][18][28][29]"
    },
    {
      id: "wrightwood",
      name: "Wrightwood, California",
      lat: 34.3608,
      lon: -117.6334,
      lane: "self-published",
      source: "src-10, src-11, src-15, src-16",
      exportable: true,
      summary: "Public self-published Keybase and Mixcloud profiles identify Steven Thomas Greeran with Wrightwood, while WrightwoodCalif's Mountain Hardware live-cam page and the local KW6WW communications page provide public town-context markers around Hwy 2, Mountain Hardware, and Table Mountain radio activity. [10][11][15][16]"
    },
    {
      id: "moka-higashi-japan",
      name: "Moka / Moka Higashi Junior High School, Tochigi, Japan",
      lat: 36.4406,
      lon: 140.0134,
      lane: "official",
      source: "src-78, src-79",
      exportable: true,
      summary: "The official Goddard handbook says the City of Glendora has a Sister City relationship with Moka, Japan and that Goddard Middle School has participated in the project for more than thirty years as a sister school with Moka Higashi Junior High School. The Consulate-General of Japan in Los Angeles separately lists Glendora and Moka as sister cities established in 1988. These sources verify the institutional exchange framework, but not any individual student's participation without additional documentation. [78][79]"
    },
    {
      id: "catalina-cherry-cove",
      name: "Catalina Island Marine Institute / Cherry Cove, Catalina Island",
      lat: 33.4464,
      lon: -118.4993,
      lane: "official",
      source: "src-80",
      exportable: true,
      summary: "Catalina Island Marine Institute's Cherry Cove program planner describes a school-oriented multi-day program with snorkeling, kayaking, tidepool/plankton work, hikes about island formation and ecology, and evening activities including astronomy, squid dissection, and campfire programming. It is a strong official context match for Catalina science-camp recollections, but it does not by itself prove a specific student's attendance. [80]"
    },
    {
      id: "astrocamp-idyllwild",
      name: "AstroCamp / Idyllwild-Pine Cove, California",
      lat: 33.7461,
      lon: -116.7177,
      lane: "official",
      source: "src-81",
      exportable: true,
      summary: "AstroCamp's official location page places the camp at 26800 Saunders Meadow Road in Idyllwild within the pine forest of the San Jacinto Mountains. This gives a clean official anchor for AstroCamp and Idyllwild-Pine Cove place memory, without independently proving who attended. [81]"
    },
    {
      id: "wrightwood-outdoor-science-school",
      name: "Wrightwood Outdoor Science School, California",
      lat: 34.3608,
      lon: -117.6334,
      lane: "official",
      source: "src-82",
      exportable: true,
      summary: "The Los Angeles County Office of Education says it operates Wrightwood Outdoor Science School as a Monday-Friday residential environmental-science program for fifth and sixth graders in the San Gabriel Mountains. This is a strong official context anchor for Wrightwood science-camp recollections, but it does not by itself identify a specific student. [82]"
    },
    {
      id: "azusa-dimc",
      name: "Azusa / Dhammakaya International Meditation Center, California",
      lat: 34.1406,
      lon: -117.8927,
      lane: "official",
      source: "src-49, src-50, src-51",
      exportable: true,
      summary: "Official DIMC and City of Azusa materials place the center at 865 E. Monrovia Place on about 12 acres between Palm Drive and Citrus Avenue, with Monrovia Nursery offices to the west and a regional detention basin to the east. DIMC's own history page traces the center from earlier California gatherings to a formal 1992 opening and the later Azusa campus. These sources verify the institution and site context only; they do not independently verify the user's ordination recollection or name. [49][50][51]"
    },
    {
      id: "arroyo-seco-official",
      name: "Arroyo Seco / Pasadena, California",
      lat: 34.1562,
      lon: -118.1673,
      lane: "official",
      source: "src-73",
      exportable: true,
      summary: "The City of Pasadena's Arroyo Seco page describes the Arroyo as an eight-mile canyon and stream course through western Pasadena with protected parkland, open space, 22 miles of trails, and National Register significance. This is useful official context for later Arroyo-house recollections, but it does not by itself identify a specific Greeran-family residence. [73]"
    },
    {
      id: "azusa-canyon-morris-dam",
      name: "Azusa Canyon / Morris Dam / Morris Reservoir, California",
      lat: 34.1785,
      lon: -117.8615,
      lane: "official",
      source: "src-74, src-75, src-77",
      exportable: true,
      summary: "NAVFAC's official Morris Dam pages describe a former 20-acre Navy research-and-development facility on a peninsula in Morris Reservoir near State Highway 39. They say the site was built in 1943, operated by Caltech from 1943 to 1950, used primarily for Naval torpedo testing from about 1945 to 1993, and decommissioned or demolished in the late 1990s. A Library of Congress HAER catalog item also exists for the Variable Angle Launcher Complex / Morris Dam Test Facility. These sources verify the official Azusa Canyon / Morris Dam military-research context only; they do not yet tie Bernard Greeran personally to the site. [74][75][77]"
    },
    {
      id: "aerojet-azusa-official",
      name: "Aerojet / Hollyvale Street, Azusa, California",
      lat: 34.135,
      lon: -117.8583,
      lane: "official",
      source: "src-76",
      exportable: true,
      summary: "EPA Superfund site information identifies AEROJET ELECTROSYSTEMS CO. at 1100 W Hollyvale St, Azusa, as part of the San Gabriel Valley (Area 2) National Priorities List site. This is a clean official anchor that the Aerojet name belongs to an Azusa industrial and environmental site, but it does not independently place Bernard Greeran there. [76]"
    },
    {
      id: "independence-private",
      name: "Independence, Missouri",
      lat: 39.0911,
      lon: -94.4155,
      lane: "private",
      source: "local-only",
      exportable: false,
      summary: "Local-only research lead for the user-supplied Science Mountain / science.edu recollection. Keep in draft until documented."
    },
    {
      id: "st-croix",
      name: "St. Croix, U.S. Virgin Islands",
      lat: 17.7420,
      lon: -64.7420,
      lane: "official",
      source: "src-1, src-2",
      exportable: true,
      summary: "Official 2025 VIDOJ releases place the registration history and later case on St. Croix. [1][2]"
    },
    {
      id: "frederiksted",
      name: "Frederiksted, St. Croix",
      lat: 17.7142,
      lon: -64.8829,
      lane: "official",
      source: "src-2, src-7, src-8",
      exportable: true,
      summary: "Official and contemporaneous reporting place the February 23, 2025 detention near Midre Cummings Park in Frederiksted. [2][7][8]"
    }
  ];

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function ensureProjectShape(project) {
    if (!project.meta) project.meta = {};
    if (!project.design) project.design = {};
    if (!project.options) project.options = {};
    if (!Array.isArray(project.chapters)) project.chapters = [];
    if (!Array.isArray(project.sources)) project.sources = [];
    const existingIds = new Set(project.sources.map((source) => source.id));
    DEFAULT_SOURCES.forEach((source) => {
      if (!existingIds.has(source.id)) project.sources.push(deepClone(source));
    });
    project.chapters.forEach((chapter) => ensureChapterShape(chapter));
    return project;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function makeChapter(title, prompt, evidence, body, placeIds = [], layout = "chapter") {
    return { title, prompt, evidence, body, placeIds, layout };
  }

  function baseProject() {
    return {
      templateId: "balanced-ledger",
      meta: {
        title: "Steven Thomas Greeran — Working Book Model",
        subtitle: "A source-balanced autobiography template",
        authorLine: "Compiled from official records, self-published resume material, and private drafting prompts",
        editionNote: "Working edition · distinguish official record, self-published material, and unverified recollection"
      },
      design: {
        paperTheme: "field-notes",
        viewerChrome: "folio",
        coverStamp: "WORKING EDITION"
      },
      options: {
        showPrompts: true,
        showEvidence: true,
        includeSources: true
      },
      methodNote:
        "This builder does not invent a first-person autobiography where none exists. Instead it models a balanced book using three lanes: official public records, self-published resume material, and private recollection prompts that should remain labeled or unpublished until verified.",
      chapters: [],
      sources: deepClone(DEFAULT_SOURCES),
      updatedAt: nowIso()
    };
  }

  const TEMPLATES = [
    {
      id: "balanced-ledger",
      label: "Balanced ledger",
      description: "Chronological book model that keeps official facts, self-published material, and open prompts in separate lanes.",
      buildProject() {
        const project = baseProject();
        project.templateId = this.id;
        project.chapters = [
          makeChapter(
            "Premise",
            "What kind of life file is possible from the currently published record?",
            "editorial",
            "The strongest public evidence is split between two classes: official 2025 Virgin Islands justice records and a later-located self-published web resume. This edition keeps those classes distinct instead of pretending they carry equal weight. Official material anchors the legal chronology, while the resume broadens the earlier education, work, and place trail. [1][2][9]"
          ),
          makeChapter(
            "Southern California trail",
            "List the verified schools, cities, and early institutional settings before UCSB.",
            "self-published",
            "The self-published resume lists Glendora High School for 1997–2001, Citrus Community College summer coursework in 2001, and California State Polytechnic Institute Pomona summer coursework in 1998. It also links projects or service items to Glendora, Duarte, San Dimas, and Pomona. Community-archive SGV Examiner issues add public local context by showing a weekly paper published in Glendora since 1997 and recurring coverage of Glendora High School and city institutions; Citrus College and the City of Glendora also point to searchable local-history collections that include the Glendoran and school yearbooks, Los Angeles Times API tables place Glendora High at 743 in 2000 and 754 in 2001, official/community reunion pages show alumni follow-up paths, and the Dick Swinney / Big Dalton materials add canyon-specific natural-history, caretaker, Girl Scout Hut, and rock-house leads for follow-up. An official-records pass now adds the library archive portal, History Q & A, MyGlendora parcel lookup, the 2026 Water Rates Zone Map path, service-area data showing that city water territory and city limits do not fully overlap, current Rock House-Big Dalton Canyon capital-project tracking, current city-limit / sphere-of-influence mapping, a 2016-17 city-budget note about staffing to care for the Big Dalton property, a 2024 city facility-assessment set for the Girl Scout Cabin, Campground, Daycamp-Restrooms, and Garage-Residences / Rock House, and newer county parcel, permit, and reservoir-management findings showing that 1803 is a government-owned camp parcel with a 1934 residential-type improvement while 1800 and 2041 sit on different sides of the city/unincorporated split, a 2012 CEQAnet Dalton Canyon Walking Trail filing by the City of Glendora lists parcels 8636036272 and 8636026272 together for recreational trail development, and separate official dam records place 2600 on parcel 8678-012-902 rather than the lower-canyon recreation parcel pair. [9][20][21][22][23][24][25][26][30][31][32][33][34][35][36][37][38][39][40][41][42][43][44][45][46][48][53][56][57][58][59][60][61][62][65][66][67][68][69][70][71][72]"
          ),
          makeChapter(
            "UCSB and the Santa Barbara coast",
            "Describe the campus, library, technical, and nearby place references that can actually be sourced.",
            "self-published",
            "The resume lists University of California, Santa Barbara in CMPSCI / the College of Engineering from 2001 to 2004. It also claims student-programmer work tied to the Alexandria Digital Library and a wax-cylinder digitization project, plus Santa Barbara-area volunteer references including the food bank, botanic garden, and a Goleta renaissance-faire role. Official UCSB alumni pages add campus-context evidence for the alumni network, Mosher Alumni House, and the 2007 launch of All Gaucho Reunion. [9][28][29]"
          ),
          makeChapter(
            "Work, service, and technical roles",
            "What jobs, volunteer roles, and civic lines appear before the later criminal record chapter?",
            "self-published",
            "Published resume entries include Channel Data Systems, Novacoast, university library programming, volunteer work in Santa Barbara, meditation-center activity, election work, and various local service roles. In a balanced book, this material belongs in the timeline even though it presently survives mainly as self-description. [9]"
          ),
          makeChapter(
            "Official legal record",
            "State only what the official and contemporaneous reporting record supports.",
            "official",
            "VIDOJ states that Greeran had a prior California conviction for child pornography with intent to sell or distribute, registered in St. Croix on October 28, 2022, last updated his registration on October 27, 2023, failed to appear for the October 28, 2024 annual update, was the subject of a wanted notice on February 21, 2025, and was detained on February 23, 2025 before being charged on February 24, 2025 under 14 V.I.C. § 1724(b)(1). Bail was set at $5,500. The charge is an accusation, not a conviction. [1][2][6][7][8]"
          ),
          makeChapter(
            "Open questions and private prompts",
            "What details might belong in a private workbook until sourced?",
            "private prompt",
            "Use this chapter for memories, schedules, apartment names, travel logs, geocaching notes, and other personal recollections that are not yet verified in published sources. Keep third-party names private unless there is a clear reason and a documented source."
          )
        ];
        return project;
      }
    },
    {
      id: "guided-memoir",
      label: "Guided memoir workbook",
      description: "Fill-in structure modeled on sold autobiography templates: origins, mentors, turning points, and unanswered questions.",
      buildProject() {
        const project = baseProject();
        project.templateId = this.id;
        project.meta.subtitle = "A workbook of prompts, gaps, and sourced anchors";
        project.design.paperTheme = "rag-paper";
        project.design.coverStamp = "PROMPT EDITION";
        project.chapters = [
          makeChapter("Origins", "Where did the early environment begin? Which locations are verified, and which are only remembered?", "prompt", "Verified starting points from the current published record include Southern California school and city references on the self-published resume, especially Glendora, Duarte, San Dimas, and Pomona. SGV Examiner archive issues help sketch Glendora civic and school context; Citrus College and the City of Glendora point to local yearbooks and the Glendoran archive for deeper follow-up, Los Angeles Times API tables anchor Glendora High's public school-performance context in 2000–2001, official/community reunion pages show that alumni-tracking paths exist, and Big Dalton public-history materials add canyon-specific leads around the rock house, Girl Scout Hut, caretakers, and natural-history collections. An official-records pass now adds Glendora library-archive, GIS, water-boundary, Rock House, and city-limit resources that can be used to test Big Dalton parcel and annexation questions without promoting private recollection as fact; newer county parcel, permit, budget, reservoir-management, and city facility-assessment findings also show that 1803 is the only current Big Dalton road situs with a 1934 residential-type improvement while nearby 1800 and 2041 split across city and unincorporated jurisdictions, that the City actively inventories a Girl Scout Cabin, Campground, Daycamp-Restrooms complex, and Rock House / residence structures in Big Dalton, that a 2012 CEQAnet Dalton Canyon Walking Trail filing by the City of Glendora lists parcels 8636036272 and 8636026272 together for recreational trail development, and that separate official dam records place 2600 on parcel 8678-012-902 rather than the lower-canyon recreation parcel pair. [9][20][21][22][23][24][25][26][30][31][32][33][34][35][36][37][38][39][40][41][42][43][44][45][46][48][53][56][57][58][59][60][61][62][65][66][67][68][69][70][71][72]"),
          makeChapter("Teachers and mentors", "Who shaped study, work, or discipline? Keep unsourced names in draft only.", "prompt", "Use this chapter to separate documented institutions from personal recollection. Only institutions or names found in reliable or self-published source material should appear in the public edition."),
          makeChapter("Campus years", "What was learned, built, or worked on during the UCSB period?", "self-published", "The resume places Greeran at UCSB from 2001 to 2004 and lists technical work connected to Davidson Library projects. [9]"),
          makeChapter("Work and service", "Which jobs or volunteer roles mark the timeline?", "self-published", "Channel Data Systems, Novacoast, library programming, volunteer positions, and civic roles appear in the resume. [9]"),
          makeChapter("Turning point: public record", "How should the public legal record be stated without overreach?", "official", "The official record presently documents registration history, noncompliance allegations, arrest, charge, and bail in the Virgin Islands. [1][2]"),
          makeChapter("What still needs proof", "What memories belong in a notebook until documented?", "private prompt", "Reserve room here for private recollection, chapter cards, photographs to locate, letters to scan, and details that should not be published until their status is clear.")
        ];
        return project;
      }
    },
    {
      id: "record-recollection",
      label: "Record + recollection",
      description: "A dual-lane book where each chapter can hold sourced record on one side and personal recollection on the other.",
      buildProject() {
        const project = baseProject();
        project.templateId = this.id;
        project.meta.subtitle = "Two-lane biography: documented record and private recollection";
        project.design.paperTheme = "ambassador-ledger";
        project.design.viewerChrome = "console";
        project.design.coverStamp = "DUAL LANE";
        project.chapters = [
          makeChapter("Lane rules", "Explain how the left-hand and right-hand evidence lanes work.", "editorial", "Use one lane for verifiable publication and another lane for memory prompts. Do not merge them without labeling."),
          makeChapter("Place ledger", "Which places are sourced, and which are only remembered?", "self-published", "Verified by the resume: Glendora, Duarte, San Dimas, Pomona, UCSB, Santa Barbara, and Goleta references. SGV Examiner archive issues add community context for Glendora as a place; City and Citrus archive guides identify further public lookup paths through the Glendoran and local yearbooks, Los Angeles Times API tables add contemporaneous Glendora High context, reunion pages offer alumni follow-up paths without constituting hard identity proof, and the Dick Swinney / Big Dalton materials add canyon-specific follow-up around the rock house, Girl Scout Hut, caretakers, and biological collecting history. The official-records pass adds library archive search tools, parcel lookup, water-service/city-limit clues, a current Rock House capital-project reference, city-limit / sphere-of-influence mapping, a city-budget staffing clue for Big Dalton, county reservoir-management context, and a city facility-assessment set that separately documents the Girl Scout Cabin, Campground, Daycamp-Restrooms, and Garage-Residences / Rock House, while a 2012 CEQAnet Dalton Canyon Walking Trail filing lists parcels 8636036272 and 8636026272 together for recreational trail development and separate official dam records place 2600 on parcel 8678-012-902. [9][20][21][22][23][24][25][26][30][31][32][33][34][35][36][37][38][39][40][41][42][43][44][45][46][48][53][65][66][67][68][69][70][71][72]"),
          makeChapter("Skill and work ledger", "What labor, study, and technical roles appear in publication?", "self-published", "Resume-backed technical and service roles can occupy the public lane. [9]"),
          makeChapter("Legal ledger", "How does the official public record read chronologically?", "official", "Use the VIDOJ releases and corroborating coverage as the anchor chapter. [1][2][3][6][7][8]"),
          makeChapter("Private recollection lane", "What stories are waiting for evidence or careful labeling?", "private prompt", "Capture them here, but do not publish them as settled fact." )
        ];
        return project;
      }
    },
    {
      id: "places-people-atlas",
      label: "Places & people atlas",
      description: "Location-driven chapter map for memoirs built around campuses, towns, jobs, and waypoints instead of pure chronology.",
      buildProject() {
        const project = baseProject();
        project.templateId = this.id;
        project.meta.subtitle = "A location-first autobiography atlas";
        project.design.paperTheme = "blueprint";
        project.design.coverStamp = "ATLAS DRAFT";
        project.chapters = [
          makeChapter("Map legend", "Define how the atlas labels official, self-published, and private place references.", "editorial", "This atlas uses evidence labels so that public readers can tell whether a place entered through official record, self-description, or private memory."),
          makeChapter("Glendora / Duarte / San Dimas / Pomona", "Group the verified Southern California nodes.", "self-published", "The resume supports these place references through school, project, and service listings. SGV Examiner archive issues further sketch Glendora school and civic context, Citrus College and City of Glendora archive pages identify yearbooks and Glendoran holdings for follow-up, Los Angeles Times API tables add contemporaneous public school context, reunion resources show class-tracking infrastructure without supplying direct identity proof, and Big Dalton-specific sources add public leads on natural-history collecting, H. Paul Keiser, Dick Swinney, canyon caretakers, the Girl Scout Hut, and the rock-house/nature-center planning history. The newer official-records pass adds Glendora library archive search tools, address/parcel GIS lookup, water-boundary clues, a current Rock House-Big Dalton Canyon project listing, city-budget staffing clues, county reservoir-management context, city-limit / sphere-of-influence mapping, and a city facility-assessment set that now officially describes the Big Dalton Girl Scout Cabin, Campground, Daycamp-Restrooms, and Garage-Residences / Rock House, while a 2012 CEQAnet Dalton Canyon Walking Trail filing lists parcels 8636036272 and 8636026272 together for recreational trail development and separate official dam records place 2600 on parcel 8678-012-902. [9][20][21][22][23][24][25][26][30][31][32][33][34][35][36][37][38][39][40][41][42][43][44][45][46][48][53][65][66][67][68][69][70][71][72]"),
          makeChapter("UCSB / Santa Barbara / Goleta", "Group the campus and coast nodes.", "self-published", "The resume connects UCSB education, library work, volunteer activity, and a Goleta faire reference. [9]"),
          makeChapter("St. Croix", "How does the later official record relocate the story?", "official", "The VIDOJ releases place the registration history and 2025 case on St. Croix. [1][2]"),
          makeChapter("Unmapped places", "Which remembered places still need documents, photographs, messages, or schedules?", "private prompt", "Hold them here until they can be responsibly published or intentionally kept private.")
        ];
        return project;
      }
    }
  ];

  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const state = {
    project: loadProject(),
    snapshots: loadSnapshots(),
    privateMemo: loadPrivateMemo(),
    fictionLegend: loadFictionLegend(),
    localPins: loadManualPins(),
    googleTimeline: loadGoogleTimeline(),
    photoSlots: loadPhotoSlots(),
    castTree: loadCastTree(),
    dnaMatches: loadDnaMatches(),
    artifactLane: loadArtifactLane(),
    privateMilestones: loadPrivateMilestones(),
    mapFilter: "all",
    selectedPlaceId: "",
    selectedChapterIndex: null,
    selectedCastId: "",
    selectedGooglePathId: "",
    pendingPhotoSlotId: "",
    pendingMilestonePhotoId: "",
    dragChapterIndex: null,
    dragMagnetIndex: null,
    mapHits: [],
    castHits: [],
    incoming: [],
    previewTimer: 0
  };

  function loadProject() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.meta && Array.isArray(parsed.chapters)) return ensureProjectShape(parsed);
      }
    } catch (_) {}
    return ensureProjectShape(TEMPLATES[0].buildProject());
  }

  function saveProject() {
    ensureProjectShape(state.project);
    state.project.updatedAt = nowIso();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.project));
  }

  function loadSnapshots() {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  }

  function saveSnapshots() {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(state.snapshots));
  }

  function loadPrivateMemo() {
    try {
      const raw = localStorage.getItem(PRIVATE_MEMO_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return {
            publicLeads: String(parsed.publicLeads || ""),
            privateLeads: String(parsed.privateLeads || "")
          };
        }
      }
    } catch (_) {}
    return {
      publicLeads: [
        "Potential public-source leads to verify:",
        "- IVTV",
        "- Daily Nexus",
        "- Daily Flush",
        "- science.edu / International Academy of Science"
      ].join("\n"),
      privateLeads: [
        "Local-only recollection prompts:",
        "- Pasadena-area origin note supplied in chat.",
        "- Keep exact hospital, birth date, birth weight, and family details out of public exports unless intentionally published.",
        "- Science Mountain / Independence, Missouri is currently a research lead, not a published fact in the viewer."
      ].join("\n")
    };
  }

  function savePrivateMemo() {
    localStorage.setItem(PRIVATE_MEMO_KEY, JSON.stringify(state.privateMemo));
  }

  function defaultFictionLegend() {
    return {
      storyTitle: "The Atlas of Borrowed Names",
      storySubtitle: "A privacy-veil story draft built from altered names and places",
      nomDePlume: "S. Vale",
      protagonistAlias: "Rowan Vale",
      exportMode: "autobiography",
      separateTimeline: true,
      sceneText: "",
      entries: [
        { id: "fx-1", real: "Steven Thomas Greeran", alias: "Rowan Vale", kind: "person" },
        { id: "fx-2", real: "Steven Greeran", alias: "Rowan Vale", kind: "person" },
        { id: "fx-3", real: "Greeran", alias: "Vale", kind: "person" },
        { id: "fx-4", real: "Wrightwood", alias: "Cedar Ridge", kind: "place" },
        { id: "fx-5", real: "Goleta", alias: "Gull Point", kind: "place" },
        { id: "fx-6", real: "Santa Barbara", alias: "Santa Brisa", kind: "place" },
        { id: "fx-7", real: "Live Oak Camp", alias: "Oak Lantern Camp", kind: "place" },
        { id: "fx-8", real: "St. Croix", alias: "Saint Crow", kind: "place" },
        { id: "fx-9", real: "Glendora", alias: "Glen Hollow", kind: "place" }
      ],
      boardTokens: ["Rowan Vale", "rides", "north", "toward", "Oak Lantern Camp", "in", "period dress"]
    };
  }

  function loadFictionLegend() {
    try {
      const raw = localStorage.getItem(FICTION_LEGEND_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const base = defaultFictionLegend();
          base.storyTitle = String(parsed.storyTitle || base.storyTitle);
          base.storySubtitle = String(parsed.storySubtitle || base.storySubtitle);
          base.nomDePlume = String(parsed.nomDePlume || base.nomDePlume);
          base.protagonistAlias = String(parsed.protagonistAlias || base.protagonistAlias);
          base.exportMode = parsed.exportMode === "fiction" ? "fiction" : "autobiography";
          base.separateTimeline = parsed.separateTimeline !== false;
          base.sceneText = String(parsed.sceneText || "");
          base.entries = Array.isArray(parsed.entries)
            ? parsed.entries.map((entry, index) => ({
              id: String(entry.id || `fx-${index + 1}`),
              real: String(entry.real || "").trim(),
              alias: String(entry.alias || "").trim(),
              kind: ["person", "place", "thing", "group"].includes(entry.kind) ? entry.kind : "person"
            })).filter((entry) => entry.real && entry.alias)
            : base.entries;
          base.boardTokens = Array.isArray(parsed.boardTokens)
            ? parsed.boardTokens.map((token) => String(token).trim()).filter(Boolean)
            : base.boardTokens;
          return base;
        }
      }
    } catch (_) {}
    return defaultFictionLegend();
  }

  function saveFictionLegend() {
    localStorage.setItem(FICTION_LEGEND_KEY, JSON.stringify(state.fictionLegend));
  }

  function loadManualPins() {
    try {
      const raw = localStorage.getItem(LOCAL_PIN_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((pin) => pin && typeof pin === "object" && Number.isFinite(Number(pin.lat)) && Number.isFinite(Number(pin.lon))).map((pin) => ({
            id: String(pin.id || `pin-${Math.random().toString(36).slice(2, 8)}`),
            name: String(pin.name || "Untitled pin"),
            lat: Number(pin.lat),
            lon: Number(pin.lon),
            lane: ["private", "self-published", "official"].includes(pin.lane) ? pin.lane : "private",
            source: "manual local pin",
            exportable: false,
            summary: String(pin.summary || "Local-only manual pin.")
          }));
        }
      }
    } catch (_) {}
    return [];
  }

  function saveManualPins() {
    localStorage.setItem(LOCAL_PIN_KEY, JSON.stringify(state.localPins));
  }

  function emptyGoogleTimeline() {
    return {
      files: [],
      importedAt: "",
      places: [],
      events: [],
      paths: [],
      stats: {
        formats: [],
        files: 0,
        visits: 0,
        activities: 0,
        pathSegments: 0,
        routeCount: 0,
        pathPointCount: 0,
        placeCount: 0,
        eventCount: 0,
        rawPlaceCount: 0,
        rawEventCount: 0,
        rawRouteCount: 0
      }
    };
  }

  function loadGoogleTimeline() {
    try {
      const raw = localStorage.getItem(GOOGLE_TIMELINE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const base = emptyGoogleTimeline();
          base.files = Array.isArray(parsed.files) ? parsed.files.map((file) => String(file)).filter(Boolean) : [];
          base.importedAt = String(parsed.importedAt || "");
          base.places = Array.isArray(parsed.places)
            ? parsed.places.filter((place) => place && Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon))).map((place, index) => ({
              id: String(place.id || `gtl-${index + 1}`),
              name: String(place.name || `Timeline place ${index + 1}`),
              lat: Number(place.lat),
              lon: Number(place.lon),
              lane: "private",
              source: "google timeline import",
              exportable: false,
              summary: String(place.summary || "Local-only place imported from Google Timeline."),
              hits: Number(place.hits || 1),
              firstSeen: String(place.firstSeen || ""),
              lastSeen: String(place.lastSeen || "")
            }))
            : [];
          base.events = Array.isArray(parsed.events)
            ? parsed.events.map((event, index) => ({
              id: String(event.id || `gtl-event-${index + 1}`),
              placeId: String(event.placeId || ""),
              routeId: String(event.routeId || ""),
              label: String(event.label || `Timeline event ${index + 1}`),
              note: String(event.note || ""),
              lane: "private",
              startTime: String(event.startTime || ""),
              endTime: String(event.endTime || ""),
              sourceFile: String(event.sourceFile || "")
            }))
            : [];
          base.paths = Array.isArray(parsed.paths)
            ? parsed.paths.map((path, index) => ({
              id: String(path.id || `gtl-path-${index + 1}`),
              label: String(path.label || `Timeline route ${index + 1}`),
              mode: String(path.mode || "Movement"),
              note: String(path.note || ""),
              lane: "private",
              startTime: String(path.startTime || ""),
              endTime: String(path.endTime || ""),
              sourceFile: String(path.sourceFile || ""),
              points: Array.isArray(path.points)
                ? path.points.map((point) => ({ lat: Number(point.lat), lon: Number(point.lon) })).filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon))
                : []
            })).filter((path) => path.points.length > 1)
            : [];
          if (parsed.stats && typeof parsed.stats === "object") {
            base.stats = {
              formats: Array.isArray(parsed.stats.formats) ? parsed.stats.formats.map((value) => String(value)).filter(Boolean) : [],
              files: Number(parsed.stats.files || base.files.length || 0),
              visits: Number(parsed.stats.visits || 0),
              activities: Number(parsed.stats.activities || 0),
              pathSegments: Number(parsed.stats.pathSegments || 0),
              routeCount: Number(parsed.stats.routeCount || base.paths.length || 0),
              pathPointCount: Number(parsed.stats.pathPointCount || base.paths.reduce((sum, path) => sum + path.points.length, 0) || 0),
              placeCount: Number(parsed.stats.placeCount || base.places.length || 0),
              eventCount: Number(parsed.stats.eventCount || base.events.length || 0),
              rawPlaceCount: Number(parsed.stats.rawPlaceCount || base.places.length || 0),
              rawEventCount: Number(parsed.stats.rawEventCount || base.events.length || 0),
              rawRouteCount: Number(parsed.stats.rawRouteCount || base.paths.length || 0)
            };
          }
          return base;
        }
      }
    } catch (_) {}
    return emptyGoogleTimeline();
  }

  function saveGoogleTimeline() {
    localStorage.setItem(GOOGLE_TIMELINE_KEY, JSON.stringify(state.googleTimeline));
  }

  function defaultPhotoSlots() {
    return Array.from({ length: 6 }, (_, index) => ({
      id: `slot-${index + 1}`,
      title: `Slot ${index + 1}`,
      caption: "",
      dataUrl: ""
    }));
  }

  function loadPhotoSlots() {
    try {
      const raw = localStorage.getItem(PHOTO_SLOT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map((slot, index) => ({
            id: String(slot.id || `slot-${index + 1}`),
            title: String(slot.title || `Slot ${index + 1}`),
            caption: String(slot.caption || ""),
            dataUrl: String(slot.dataUrl || "")
          }));
        }
      }
    } catch (_) {}
    return defaultPhotoSlots();
  }

  function savePhotoSlots() {
    localStorage.setItem(PHOTO_SLOT_KEY, JSON.stringify(state.photoSlots));
  }

  function normalizeConnectionLabel(value) {
    const token = normalizeText(value).replace(/[^a-z0-9]+/g, " ").trim();
    if (!token) return "";
    if (["mom", "mother", "dad", "father", "stepmother", "stepfather", "grandmother", "grandfather", "grandma", "grandpa", "parent", "ancestor"].includes(token)) return "parent";
    if (["son", "daughter", "child", "children"].includes(token)) return "child";
    if (["brother", "sister", "sibling", "stepbrother", "stepsister", "half brother", "half sister"].includes(token)) return "sibling";
    if (["wife", "husband", "spouse", "partner", "fiance", "fiancee"].includes(token)) return "spouse";
    if (["cousin", "aunt", "uncle", "niece", "nephew", "in law", "family", "relative"].includes(token)) return "family";
    if (["friend", "buddy", "pal"].includes(token)) return "friend";
    if (["mentor", "teacher", "coach", "advisor", "professor", "sensei", "rabbi", "pastor"].includes(token)) return "mentor";
    if (["roommate", "housemate", "tenant", "landlord"].includes(token)) return "roommate";
    if (["neighbor", "neighbour"].includes(token)) return "neighbor";
    if (["self", "root"].includes(token)) return "self";
    return ["parent", "child", "sibling", "spouse", "family", "friend", "mentor", "roommate", "neighbor", "other"].includes(token) ? token : "";
  }

  function inferConnectionLabel(value) {
    const token = normalizeText(value).replace(/[^a-z0-9]+/g, " ").trim();
    if (!token) return "";
    if (/\b(mother|father|mom|dad|stepmother|stepfather|grandmother|grandfather|grandma|grandpa|parent|ancestor)\b/.test(token)) return "parent";
    if (/\b(son|daughter|child|children)\b/.test(token)) return "child";
    if (/\b(brother|sister|sibling|stepbrother|stepsister|half brother|half sister)\b/.test(token)) return "sibling";
    if (/\b(wife|husband|spouse|partner|fiance|fiancee|married)\b/.test(token)) return "spouse";
    if (/\b(cousin|aunt|uncle|niece|nephew|in law|family|relative)\b/.test(token)) return "family";
    if (/\b(friend|buddy|pal)\b/.test(token)) return "friend";
    if (/\b(mentor|teacher|coach|advisor|professor|sensei|rabbi|pastor)\b/.test(token)) return "mentor";
    if (/\b(roommate|housemate|tenant|landlord)\b/.test(token)) return "roommate";
    if (/\b(neighbor|neighbour)\b/.test(token)) return "neighbor";
    if (/\b(self|root)\b/.test(token)) return "self";
    return "";
  }

  function parseConnectionToken(raw) {
    const value = String(raw || "").trim();
    if (!value) return null;
    if (isSelfNodeName(value)) return { target: "self", label: "" };
    let match = value.match(/^(parent|child|sibling|spouse|family|friend|mentor|roommate|neighbor|self|root)\s*[:=-]\s*(.+)$/i);
    if (match) {
      const target = isSelfNodeName(match[2]) ? "self" : match[2].trim();
      return target ? { target, label: normalizeConnectionLabel(match[1]) } : null;
    }
    match = value.match(/^(.+?)\s*[\[(]([^\])]+)[\])]\s*$/);
    if (match) {
      const label = normalizeConnectionLabel(match[2]);
      if (label) {
        const target = isSelfNodeName(match[1]) ? "self" : match[1].trim();
        return target ? { target, label } : null;
      }
    }
    match = value.match(/^(.+?)\s*(?:\||—|–|-|:)\s*(parent|child|sibling|spouse|family|friend|mentor|roommate|neighbor|self|root)$/i);
    if (match) {
      const target = isSelfNodeName(match[1]) ? "self" : match[1].trim();
      return target ? { target, label: normalizeConnectionLabel(match[2]) } : null;
    }
    return { target: isSelfNodeName(value) ? "self" : value, label: inferConnectionLabel(value) };
  }

  function parseConnectionList(value) {
    return String(value || "")
      .split(/\s*,\s*|\n+/)
      .map((token) => parseConnectionToken(token))
      .filter((token) => token && token.target);
  }

  function normalizeConnectionDetails(entry) {
    const details = Array.isArray(entry?.linkDetails) && entry.linkDetails.length
      ? entry.linkDetails.map((item) => {
        if (typeof item === "string") return parseConnectionToken(item);
        const target = isSelfNodeName(item?.target || item?.name || item?.link || item?.to)
          ? "self"
          : String(item?.target || item?.name || item?.link || item?.to || "").trim();
        return target
          ? {
              target,
              label: normalizeConnectionLabel(item?.label || item?.relation || item?.kind || item?.type || "")
            }
          : null;
      }).filter(Boolean)
      : (Array.isArray(entry?.links)
        ? entry.links.map((item) => parseConnectionToken(item)).filter(Boolean)
        : parseConnectionList(entry?.links));
    const seen = new Set();
    return details.filter((item) => {
      const key = `${normalizeText(item.target)}|${item.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function connectionDetails(entry) {
    return normalizeConnectionDetails(entry);
  }

  function connectionTargets(entry) {
    return connectionDetails(entry).map((item) => item.target);
  }

  function formatConnectionLabel(connection) {
    if (!connection) return "";
    const target = connection.target === "self" ? "self" : connection.target;
    return connection.label ? `${humanizeToken(connection.label)} → ${target}` : `↔ ${target}`;
  }

  function formatConnectionSummary(entry) {
    const details = connectionDetails(entry);
    return details.length
      ? details.map((item) => formatConnectionLabel(item)).join(", ")
      : "No explicit links yet. Add names or labels like parent: self, spouse: Alex, sibling: Nora.";
  }

  function deriveLifeContextTags(text) {
    const value = normalizeText(text);
    const tags = [];
    const rules = [
      [/\b(ucsb|university of california santa barbara|davidson library|alexandria digital library|map and imagery lab|map imagery lab|cylinder audio archive)\b/, "UCSB / Davidson Library"],
      [/\b(santa barbara|goleta|live oak camp|la cumbre magnolia lodge)\b/, "Santa Barbara / Goleta"],
      [/\b(paramount ranch|agoura|agoura hills|glen helen|devore|renaissance pleasure faire|freedom acres|deer park nudist resort)\b/, "Southern California faire circuit"],
      [/\b(lakewood,? co|lakewood,? colorado|colorado|radeon basement)\b/, "Colorado recollection"],
      [/\b(wrightwood|mountain hardware|hwy 2|highway 2|kw6ww|table mountain|frost peak)\b/, "Wrightwood / Hwy 2"],
      [/\b(glendora|duarte|san dimas|san dimas experimental forest|tanbark|tanbark flats|azusa|citrus community college|cal poly pomona|pomona|mount san antonio college|mt sac|horticulture|dhammakaya|monrovia place)\b/, "San Gabriel Valley"],
      [/\b(st croix|st\. croix|frederiksted|usvi|virgin islands)\b/, "St. Croix / USVI"]
    ];
    rules.forEach(([pattern, label]) => {
      if (pattern.test(value) && !tags.includes(label)) tags.push(label);
    });
    return tags;
  }

  function loadCastTree() {
    try {
      const raw = localStorage.getItem(CAST_TREE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((entry, index) => {
            const linkDetails = normalizeConnectionDetails(entry);
            return {
              id: String(entry.id || `cast-${index + 1}`),
              name: String(entry.name || "Untitled"),
              relation: String(entry.relation || "other"),
              era: String(entry.era || ""),
              branch: String(entry.branch || ""),
              generation: Number.isFinite(Number(entry.generation)) ? Number(entry.generation) : null,
              linkDetails,
              links: linkDetails.map((item) => item.target),
              note: String(entry.note || "")
            };
          });
        }
      }
    } catch (_) {}
    return [];
  }

  function saveCastTree() {
    localStorage.setItem(CAST_TREE_KEY, JSON.stringify(state.castTree));
  }

  function seedPrivateCastTree() {
    const seeds = [
      {
        name: "Charles Hewitt",
        relation: "family",
        era: "San Gabriel Valley memory",
        branch: "",
        generation: null,
        linkDetails: [{ target: "self", label: "family" }],
        links: ["self"],
        note: "User-supplied private recollection: uncle Charles (\"Chuck\") Hewitt is tied to the San Dimas Experimental Forest / Tanbark Flats horticulture memory. Keep local-only until sourced or intentionally published."
      },
      {
        name: "Becky Cravitz",
        relation: "friend",
        era: "Southern California faire circuit",
        branch: "",
        generation: null,
        linkDetails: [{ target: "self", label: "friend" }],
        links: ["self"],
        note: "User-supplied private recollection: stayed at a campground at night with Becky Cravitz in the Glen Helen / Freedom Acres orbit during the Renaissance Faire period; exact spelling and public documentation still need verification. Keep local-only until sourced or intentionally published."
      },
      {
        name: "Mara Grace Octal",
        relation: "friend",
        era: "Colorado recollection",
        branch: "",
        generation: null,
        linkDetails: [{ target: "self", label: "friend" }],
        links: ["self"],
        note: "User-supplied private recollection: stayed with Mara Grace Octal in a \"Radeon basement\" in Lakewood, Colorado; exact spelling and wording may need later confirmation. Keep local-only until sourced or intentionally published."
      },
      {
        name: "Bernard Greeran",
        relation: "family lead",
        era: "Azusa / Aerojet recollection",
        branch: "",
        generation: null,
        linkDetails: [{ target: "self", label: "family lead" }],
        links: ["self"],
        note: "User-supplied private recollection: Bernard Greeran did work for Aerojet in Azusa; exact relation, dates, and employer paperwork still need confirmation. Keep local-only until sourced or intentionally published."
      },
      {
        name: "Mother",
        relation: "family",
        era: "Glendora school and home-computing memory",
        branch: "",
        generation: 1,
        linkDetails: [{ target: "self", label: "parent" }],
        links: ["self"],
        note: "User-supplied private recollection: worked at Sellers Elementary School in the computer lab and is tied to GATE, Number Munchers, Crosscountry Truck Driving, and Apple IIe-era school-computing memory. Keep local-only until sourced or intentionally published."
      },
      {
        name: "Mrs. Green",
        relation: "mentor",
        era: "Glendora school memory",
        branch: "",
        generation: null,
        linkDetails: [{ target: "self", label: "mentor" }],
        links: ["self"],
        note: "User-supplied private recollection: Mrs. Green was principal at the time and is tied to early Prodigy / school-computer recollection; exact school, spelling, and date still need confirmation. Keep local-only until sourced or intentionally published."
      },
      {
        name: "Dick Sweeney",
        relation: "mentor",
        era: "Glendora natural-history memory",
        branch: "",
        generation: null,
        linkDetails: [{ target: "self", label: "mentor" }],
        links: ["self"],
        note: "User-supplied private recollection: bug-collecting mentor tied to BioQuip equipment including the net, jars, and transparent envelopes; exact surname may need confirmation against public Dick Swinney/Sweeney references. Keep local-only until sourced or intentionally published."
      },
      {
        name: "Dad", 
        relation: "family",
        era: "Glendora / Big Dalton work memory",
        branch: "Paternal branch",
        generation: 1,
        linkDetails: [{ target: "self", label: "parent" }],
        links: ["self"],
        note: "User-supplied private recollection: worked for the street yard with Jim Henderson, then left for the water department, where canyon lockup and closing duties could bring overtime pay plus a take-home vehicle and uniform service. Keep local-only until sourced or intentionally published."
      },
      {
        name: "Jim Henderson",
        relation: "friend",
        era: "Glendora / Big Dalton work memory",
        branch: "Paternal branch",
        generation: null,
        linkDetails: [{ target: "Dad", label: "friend" }],
        links: ["Dad"],
        note: "User-supplied private recollection: worked with Dad at the street yard. Keep local-only until sourced or intentionally published."
      },
      {
        name: "Dan Bjorklund",
        relation: "friend",
        era: "Family marriage memory",
        branch: "Paternal branch",
        generation: null,
        linkDetails: [{ target: "Dad", label: "friend" }],
        links: ["Dad"],
        note: "User-supplied private recollection: Dad said his best man was Dan Bjorklund; exact spelling or marriage-license wording may need verification. Keep local-only until sourced or intentionally published."
      },
      {
        name: "Grandma Louise",
        relation: "family",
        era: "Family organization memory",
        branch: "Paternal branch",
        generation: 2,
        linkDetails: [{ target: "Dad", label: "family" }],
        links: ["Dad"],
        note: "User-supplied private recollection: Grandma Louise was part of the Ancient and Honorable Order of the Squirrels. Keep local-only until sourced or intentionally published."
      },
      {
        name: "Jeanie",
        relation: "other",
        era: "Family recollection",
        branch: "Paternal branch",
        generation: null,
        linkDetails: [],
        links: [],
        note: "User-supplied private recollection: Jeanie had a twin sister, but the exact identity/relationship still needs clarification. Keep local-only until sourced or intentionally published."
      }
    ];
    const seen = new Set((state.castTree || []).map((entry) => normalizeText(entry.name)));
    let changed = false;
    seeds.forEach((seed, index) => {
      if (seen.has(normalizeText(seed.name))) return;
      state.castTree.unshift({
        id: `cast-seed-${Date.now().toString(36)}-${index}`,
        ...seed
      });
      seen.add(normalizeText(seed.name));
      changed = true;
    });
    if (changed) saveCastTree();
  }

  function loadDnaMatches() {
    try {
      const raw = localStorage.getItem(DNA_MATCH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((entry, index) => ({
            id: String(entry.id || `dna-${index + 1}`),
            name: String(entry.name || "Untitled match").trim(),
            side: ["maternal", "paternal", "both", "unknown"].includes(entry.side) ? entry.side : "unknown",
            sharedPercent: Number.isFinite(Number(entry.sharedPercent)) ? Number(entry.sharedPercent) : null,
            sharedCm: Number.isFinite(Number(entry.sharedCm)) ? Number(entry.sharedCm) : null,
            relationGuess: String(entry.relationGuess || "").trim(),
            linkedPerson: String(entry.linkedPerson || "").trim(),
            note: String(entry.note || "").trim()
          })).filter((entry) => entry.name);
        }
      }
    } catch (_) {}
    return [];
  }

  function saveDnaMatches() {
    localStorage.setItem(DNA_MATCH_KEY, JSON.stringify(state.dnaMatches));
  }

  function loadPrivateMilestones() {
    try {
      const raw = localStorage.getItem(PRIVATE_MILESTONE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((entry, index) => {
            const normalized = {
              id: String(entry.id || `milestone-${index + 1}`),
              title: String(entry.title || "Untitled memory").trim(),
              era: String(entry.era || "").trim(),
              place: String(entry.place || "").trim(),
              people: String(entry.people || "").trim(),
              linkedCastNames: parseMilestoneCastNames(Array.isArray(entry.linkedCastNames)
                ? entry.linkedCastNames
                : (String(entry.linkedCastNames || "").trim() ? entry.linkedCastNames : entry.people)),
              photoDataUrl: String(entry.photoDataUrl || "").trim(),
              note: String(entry.note || "").trim()
            };
            normalized.category = milestoneCategory(entry.category, normalized);
            return normalized;
          }).filter((entry) => entry.title);
        }
      }
    } catch (_) {}
    return [];
  }

  function savePrivateMilestones() {
    localStorage.setItem(PRIVATE_MILESTONE_KEY, JSON.stringify(state.privateMilestones));
  }

  function loadArtifactLane() {
    try {
      const raw = localStorage.getItem(ARTIFACT_LANE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((entry, index) => ({
            id: String(entry.id || `artifact-${index + 1}`),
            title: String(entry.title || "Untitled item").trim(),
            kind: ["vehicle", "object", "document", "clothing", "symbol"].includes(entry.kind) ? entry.kind : "object",
            era: String(entry.era || "").trim(),
            place: String(entry.place || "").trim(),
            marking: String(entry.marking || "").trim(),
            note: String(entry.note || "").trim()
          })).filter((entry) => entry.title);
        }
      }
    } catch (_) {}
    return [];
  }

  function saveArtifactLane() {
    localStorage.setItem(ARTIFACT_LANE_KEY, JSON.stringify(state.artifactLane));
  }

  function seedPrivateArtifactLane() {
    const seeds = [
      {
        signature: "5bzz601",
        title: "Gray 4-door 2003 Corolla S-type",
        kind: "vehicle",
        era: "2003",
        place: "",
        marking: "5BZZ601 · GRYGHST / GRYGHOST · plate frame: my other ride is a U-2 Dragon Lady",
        note: "User-supplied private recollection. Keep local-only unless corroborated or intentionally published."
      },
      {
        signature: "thumb sensor color change health food store",
        title: "Color-changing thumb sensor",
        kind: "object",
        era: "",
        place: "Glendora, California",
        marking: "Thumb sensor that changed colors",
        note: "User-supplied private recollection: mother gave this from the old health food store. Keep local-only unless corroborated or intentionally published."
      },
      {
        signature: "sellers number munchers apple iie",
        title: "Sellers computer lab Apple IIe / Number Munchers memory",
        kind: "object",
        era: "Glendora school years",
        place: "Sellers Elementary School, Glendora, California",
        marking: "Number Munchers · Apple IIe · computer lab",
        note: "User-supplied private recollection: mother worked at Sellers Elementary School in the computer lab, tied to Number Munchers, Crosscountry Truck Driving, and Apple IIe-era school computing. Keep local-only unless corroborated or intentionally published."
      },
      {
        signature: "chtw53a chtw53c prodigy cybergate 2wire pager",
        title: "Dial-up handles and modem trail",
        kind: "document",
        era: "Home-computing / university years",
        place: "Glendora home-computing / dial-up memory",
        marking: "CHTW53A primary · CHTW53C user · Prodigy Classic for groceries · 56k V.90 · CyberGate Internet · Ultimate Internet Access · 2Wire SDSL · DNA Doctors Net Access · AOL coasters · pager",
        note: "User-supplied private recollection: remembers Prodigy Classic for groceries before later internet service, then 56k V.90, CyberGate Internet, Ultimate Internet Access, and 2Wire SDSL, later trying DNA Doctors Net Access and AOL mailer/coaster offers around university years, with free dial-up and pagers remembered around $50 per year. Keep local-only unless corroborated or intentionally published."
      },
      {
        signature: "bioquip net jars transparent envelopes dick sweeney",
        title: "BioQuip insect-collecting kit",
        kind: "object",
        era: "Glendora natural-history years",
        place: "Glendora, California",
        marking: "BioQuip net · jars · transparent envelopes",
        note: "User-supplied private recollection: went bug collecting with BioQuip equipment from Dick Sweeney, including the net, jars, and transparent envelopes. Keep local-only unless corroborated or intentionally published."
      },
      {
        signature: "pomona feed fuel chicken coop",
        title: "Pomona Feed & Fuel chicken coop",
        kind: "object",
        era: "Earlier Big Dalton Canyon years",
        place: "Glendora, California",
        marking: "Chicken coop at 2860 Big Dalton Canyon Rd",
        note: "User-supplied private recollection: the 2860 property had a chicken coop from Pomona Feed & Fuel near a duck pond Dad made. Keep local-only unless corroborated or intentionally published."
      },
      {
        signature: "egg incubator checking eggs under light",
        title: "Egg incubator and checking light",
        kind: "object",
        era: "Earlier Big Dalton Canyon years",
        place: "Glendora, California",
        marking: "Checking eggs under the light and putting them in the incubator",
        note: "User-supplied private recollection tied to the 2860 Big Dalton Canyon house. Keep local-only unless corroborated or intentionally published."
      }
    ];
    let changed = false;
    seeds.forEach((seed, index) => {
      if (state.artifactLane.some((entry) => normalizeText([entry.title, entry.marking, entry.note].join(" ")).includes(seed.signature))) return;
      state.artifactLane.unshift({
        id: `artifact-seed-${Date.now().toString(36)}-${index}`,
        title: seed.title,
        kind: seed.kind,
        era: seed.era,
        place: seed.place,
        marking: seed.marking,
        note: seed.note
      });
      changed = true;
    });
    if (changed) saveArtifactLane();
  }

  function seedPrivateMilestones() {
    const seeds = [
      {
        id: "milestone-seed-glendora-grad-2001",
        title: "Glendora High School graduation",
        era: "2001",
        place: "Glendora, California",
        people: "",
        linkedCastNames: [],
        photoDataUrl: "",
        category: "wedding-ceremony",
        note: "User-supplied private recollection: went there and graduated in 2001. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-sadie-stacy-hall",
        title: "Sadie Hawkins",
        era: "Glendora High School era",
        place: "Glendora, California",
        people: "Stacy Hall",
        linkedCastNames: ["Stacy Hall"],
        photoDataUrl: "",
        category: "school-dance-reunion",
        note: "User-supplied private recollection: went with Stacy Hall. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-prom-stefanie-maroun",
        title: "Prom",
        era: "Glendora High School era",
        place: "Glendora, California",
        people: "Stefanie Maroun",
        linkedCastNames: ["Stefanie Maroun"],
        photoDataUrl: "",
        category: "school-dance-reunion",
        note: "User-supplied private recollection: went with Stefanie Maroun. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-morgan-weintraub-wedding",
        title: "Morgan Weintraub wedding",
        era: "Wedding memory",
        place: "Pomona, California",
        people: "Morgan Weintraub",
        linkedCastNames: [],
        photoDataUrl: "",
        category: "wedding-ceremony",
        note: "User-supplied private recollection: went to a wedding at the Pomona Valley Mining Company, between Morgan Weintraub and her husband, at the golf course by the Pomona State Fair grounds. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-ali-arianna-kimmia-wedding",
        title: "Ali Arianna and Kimmia wedding",
        era: "Wedding memory",
        place: "",
        people: "Ali Arianna and Kimmia",
        linkedCastNames: [],
        photoDataUrl: "",
        category: "wedding-ceremony",
        note: "User-supplied private recollection: went to Ali Arianna and Kimmia wedding. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-ashley-handing-ryan-beck-wedding",
        title: "Ashley Handling and Ryan Beck wedding",
        era: "Wedding memory",
        place: "",
        people: "Ashley Handling and Ryan Beck",
        linkedCastNames: [],
        photoDataUrl: "",
        category: "wedding-ceremony",
        note: "User-supplied private recollection: went to Ashley Handling and Ryan Beck wedding. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-rebecca-simpson-wedding",
        title: "Rebecca Simpson wedding",
        era: "Wedding memory",
        place: "Santa Barbara, California",
        people: "Rebecca Simpson",
        linkedCastNames: [],
        photoDataUrl: "",
        category: "wedding-ceremony",
        note: "User-supplied private recollection: went to Rebecca Simpson wedding at the Santa Barbara Country Club. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-big-dalton-2860-residence",
        title: "2860 E. Big Dalton Canyon Rd residence",
        era: "Earlier Big Dalton Canyon years",
        place: "Glendora, California",
        people: "",
        linkedCastNames: [],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: previously lived at 2860 E. Big Dalton Canyon Rd, then moved to 1803 E. Big Dalton Canyon Rd after Joe Hawks left or retired. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-big-dalton-2860-duck-pond",
        title: "2860 driveway, duck pond, and chicken coop",
        era: "Earlier Big Dalton Canyon years",
        place: "Glendora, California",
        people: "Dad",
        linkedCastNames: ["Dad"],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: there was a broken-down stair set in front of 2860, but the driveway went up to the house, where Dad made a duck pond and there was a chicken coop from Pomona Feed & Fuel. The user remembers checking eggs under a light and putting them in an incubator. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-big-dalton-1803-stone-house", 
        title: "1803 E. Big Dalton Canyon Rd stone house",
        era: "Later Big Dalton Canyon years",
        place: "Glendora, California",
        people: "",
        linkedCastNames: [],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: lived in a stone house at 1803 E. Big Dalton Canyon Rd, won a savings bond for landscaping a business there, and remembers the yard layout. Also recalls a property-line sign, city ownership or 99-year lease questions, and county-versus-city water-rate boundary issues; possible verification path is Glendora City Hall. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-san-dimas-experimental-forest-tanbark",
        title: "San Dimas Experimental Forest / Tanbark Flats recollection",
        era: "San Gabriel Valley memory",
        place: "San Dimas Experimental Forest / Tanbark Flats, California",
        people: "Charles Hewitt (\"Chuck\")",
        linkedCastNames: ["Charles Hewitt"],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: San Dimas Experimental Forest tanbark was used by uncle Charles Hewitt (\"Chuck\") for a horticulture class from Mount San Antonio College. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-freedom-acres-glen-helen-campground",
        title: "Glen Helen / Freedom Acres campground night",
        era: "Southern California faire circuit",
        place: "Freedom Acres / former Deer Park lead, San Bernardino County",
        people: "Becky Cravitz",
        linkedCastNames: ["Becky Cravitz"],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: stayed at the campground at night with Becky Cravitz in the Freedom Acres / Glen Helen orbit, tied to the Renaissance Faire period. The user also recalls Deer Park nudist-resort history at the site and remembers the original Southern California Renaissance Faire as beginning in Agoura, with people meeting at Paramount Ranch. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-lakewood-colorado-basement-stay",
        title: "Lakewood, Colorado basement stay",
        era: "Colorado recollection",
        place: "Lakewood, Colorado",
        people: "Mara Grace Octal",
        linkedCastNames: ["Mara Grace Octal"],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: stayed with Mara Grace Octal in a \"Radeon basement\" in Lakewood, Colorado. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-arroyo-seco-azusa-canyon-lead",
        title: "Arroyo Seco house / Azusa Canyon lead",
        era: "Southern California family recollection",
        place: "Arroyo Seco / Los Angeles area",
        people: "Bernard Greeran",
        linkedCastNames: ["Bernard Greeran"],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: after the Arroyo Seco house in Los Angeles, the rocks are from Azusa Canyon, and Bernard Greeran did work for Aerojet in Azusa. Official Morris Dam and Aerojet records may provide context, but no direct public Bernard Greeran employment record has been recovered yet. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-moka-japan-exchange",
        title: "Moka / Moka Higashi exchange-student trip",
        era: "Goddard Middle School years",
        place: "Moka, Tochigi, Japan",
        people: "",
        linkedCastNames: [],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: went as an exchange student to Moka Higashi in Japan through Sister Cities International and Goddard Middle School. Official school materials point to Moka Higashi Junior High School in Glendora's sister city of Moka, Japan, but the user's individual participation remains local-only unless separately documented or intentionally published."
      },
      {
        id: "milestone-seed-gate-sellers-computer-lab",
        title: "GATE / Sellers computer-lab memory",
        era: "Elementary-school years",
        place: "Sellers Elementary School, Glendora, California",
        people: "Mother · Mrs. Green",
        linkedCastNames: ["Mother", "Mrs. Green"],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: tied to the GATE program, Sellers Elementary School, and a computer lab where the user's mother worked with Number Munchers, Crosscountry Truck Driving, and Apple IIe-era school computing. The user also recalls that Mrs. Green was principal at the time. Keep local-only unless separately documented or intentionally published."
      },
      {
        id: "milestone-seed-glendora-dialup-sequence",
        title: "Glendora dial-up and modem sequence",
        era: "Home-computing / university years",
        place: "Glendora home-computing / dial-up memory",
        people: "Mother · Mrs. Green",
        linkedCastNames: ["Mother", "Mrs. Green"],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: remembers Prodigy Classic for groceries before it became associated with internet service, then dial-up handle CHTW53C under primary account CHTW53A, later 56k V.90, CyberGate Internet, Ultimate Internet Access, and a 2Wire SDSL modem; by university the user recalls trying DNA Doctors Net Access and AOL coaster-mailers, plus free dial-up and pagers remembered around fifty dollars per year. Keep local-only unless separately documented or intentionally published."
      },
      {
        id: "milestone-seed-bioquip-bug-collecting",
        title: "BioQuip bug-collecting outings",
        era: "Glendora natural-history years",
        place: "Glendora, California",
        people: "Dick Sweeney",
        linkedCastNames: ["Dick Sweeney"],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: went bug collecting with BioQuip equipment from Dick Sweeney, including the net, jars, and transparent envelopes. Exact surname may need confirmation against public Dick Swinney/Sweeney references. Keep local-only unless separately documented or intentionally published."
      },
      {
        id: "milestone-seed-catalina-cherry-cove-science-camp", 
        title: "Catalina Island / Cherry Cove science camp",
        era: "Middle-school science-camp years",
        place: "Catalina Island Marine Institute / Cherry Cove, Catalina Island",
        people: "",
        linkedCastNames: [],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: attended Catalina Island science camp at CIMI / Cherry Cove; the user's wording also came through as \"cimi valley cherry cove science camp.\" Keep local-only unless separately documented or intentionally published."
      },
      {
        id: "milestone-seed-astrocamp-idyllwild",
        title: "AstroCamp in Idyllwild-Pine Cove",
        era: "Middle-school science-camp years",
        place: "AstroCamp / Idyllwild-Pine Cove, California",
        people: "",
        linkedCastNames: [],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: attended AstroCamp in Idyllwild-Pine Cove; the remembered wording came through as \"idywyld pinecone.\" Keep local-only unless separately documented or intentionally published."
      },
      {
        id: "milestone-seed-wrightwood-science-camp",
        title: "Wrightwood science camp",
        era: "Middle-school science-camp years",
        place: "Wrightwood Outdoor Science School, California",
        people: "",
        linkedCastNames: [],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: attended science camp in Wrightwood. Official LACOE materials verify the Wrightwood Outdoor Science School program context, but the user's attendance remains local-only unless separately documented or intentionally published."
      },
      {
        id: "milestone-seed-dad-water-department-canyon-lockup",
        title: "Dad moved from street yard to water department",
        era: "Glendora / Big Dalton work memory",
        place: "Glendora, California",
        people: "Dad · Jim Henderson",
        linkedCastNames: ["Dad", "Jim Henderson"],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: Dad worked for the street yard with Jim Henderson, then left to work for the water department. The water-department role reportedly included overtime pay to close and lock up the canyon, a take-home vehicle, and uniform service. Keep local-only until sourced or intentionally published."
      },
      {
        id: "milestone-seed-tour-of-california-little-dalton",
        title: "Amgen Tour of California bike-race staging at 1803",
        era: "Big Dalton Canyon years",
        place: "1803 E. Big Dalton Canyon Rd / Little Dalton / Monroe Truck Trail, Glendora, California",
        people: "",
        linkedCastNames: [],
        photoDataUrl: "",
        category: "other",
        note: "User-supplied private recollection: during Amgen Tour of California bike-race events, the bikes were parked in front of the 1803 house a couple of times and the route used the Monroe Truck Trail through Little Dalton. Keep local-only unless separately documented or intentionally published."
      }
    ];
    const seen = new Set((state.privateMilestones || []).map((entry) => normalizeText([entry.title, entry.people, entry.note].join(" "))));
    let changed = false;
    seeds.forEach((seed) => {
      const signature = normalizeText([seed.title, seed.people, seed.note].join(" "));
      if (seen.has(signature)) return;
      state.privateMilestones.push(seed);
      seen.add(signature);
      changed = true;
    });
    if (changed) savePrivateMilestones();
  }

  function seedPrivatePromptNotes() {
    const lines = [
      "- Glendora High School recollection: went there and graduated in 2001. Keep local-only until sourced or intentionally published.",
      "- Glendora High School recollection: went to Sadie Hawkins with Stacy Hall. Keep local-only until sourced or intentionally published.",
      "- Glendora High School recollection: went to prom with Stefanie Maroun. Keep local-only until sourced or intentionally published.",
      "- Glendora High School reunion recollection: the reunion may have been at La Verne Country Club, and the user recalls attending. Keep local-only until sourced or intentionally published.",
      "- Wedding recollection: went to a wedding at the Pomona Valley Mining Company, between Morgan Weintraub and her husband, at the golf course by the Pomona State Fair grounds. Keep local-only until sourced or intentionally published.",
      "- Wedding recollection: went to Ali Arianna and Kimmia wedding. Keep local-only until sourced or intentionally published.",
      "- Wedding recollection: went to Ashley Handling and Ryan Beck wedding. Keep local-only until sourced or intentionally published.",
      "- Wedding recollection: went to Rebecca Simpson wedding at the Santa Barbara Country Club. Keep local-only until sourced or intentionally published.",
      "- Glendora / Big Dalton Canyon recollection: lived in a stone house at 1803 E. Big Dalton Canyon Rd, won a savings bond for landscaping a business there, and remembers the yard layout. Keep local-only until sourced or intentionally published.",
      "- Glendora / Big Dalton Canyon recollection: previously lived at 2860 E. Big Dalton Canyon Rd and recalls moving from 2860 to 1803 after Joe Hawks left or retired. Keep local-only until sourced or intentionally published.",
      "- Glendora / Big Dalton Canyon recollection: county water rates were on the other side of the road and city water rates were on this side, but this side may still have been outside city limits until age 18; possible verification path is Glendora City Hall. Keep local-only until sourced or intentionally published.",
      "- Glendora / Big Dalton Canyon recollection: a sign stood at the property line, and there may have been city ownership, a 99-year lease, or an Ida Meacham comparison around the house and later teardown. Keep local-only until sourced or intentionally published.",
      "- Glendora / Big Dalton Canyon recollection: at 2860 there was a broken-down stair set in front, but the driveway went up to the house. Dad made a duck pond there, and there was a chicken coop from Pomona Feed & Fuel. The user remembers checking eggs under a light and putting them in an incubator. Keep local-only until sourced or intentionally published.",
      "- Glendora / Big Dalton Canyon recollection: remembers a Richard Stram or Dick Strahan-era dam keeper, a possible weekend dam keeper, and a Girl Scout hut with animals. Keep local-only until sourced or intentionally published.",
      "- Glendora / Big Dalton Canyon recollection: later remembers Kevin Sweeney there with daughters Gillian and Katelyn. Keep local-only until sourced or intentionally published.",
      "- Southern California faire-circuit recollection: remembers Deer Park nudist-resort history and the later Freedom Acres site across from Glen Helen, with a campground night there with Becky Cravitz during the Renaissance Faire period. Keep local-only until sourced or intentionally published.",
      "- Southern California faire-circuit recollection: remembers the original Renaissance Faire in Agoura Hills and says people met at Paramount Ranch. Keep local-only until sourced or intentionally published.",
      "- Colorado recollection: stayed with Mara Grace Octal in a \"Radeon basement\" in Lakewood, Colorado; exact spelling and wording may need later confirmation. Keep local-only until sourced or intentionally published.",
      "- Arroyo Seco / Azusa Canyon recollection: after the Arroyo Seco house in Los Angeles, the rocks are from Azusa Canyon, and Bernard Greeran did work for Aerojet in Azusa. Morris Dam torpedo-testing records and Library of Congress holdings may offer public context, but no direct public Bernard Greeran employment record has been recovered yet. Keep local-only until sourced or intentionally published.",
      "- Goddard / Japan recollection: went as an exchange student to Moka Higashi in Japan through Sister Cities International and Goddard Middle School; official school materials point to Moka Higashi Junior High School in Moka, Japan, but keep the user's personal participation local-only unless separately documented or intentionally published.",
      "- Catalina recollection: attended science camp at Catalina Island Marine Institute / Cherry Cove; the remembered wording also came through as \"cimi valley cherry cove science camp.\" Keep local-only until sourced or intentionally published.",
      "- Idyllwild recollection: attended AstroCamp in Idyllwild-Pine Cove; the remembered wording came through as \"idywyld pinecone.\" Keep local-only until sourced or intentionally published.",
      "- Wrightwood recollection: attended science camp in Wrightwood. Keep local-only until sourced or intentionally published.",
      "- Glendora school recollection: tied to the GATE program and Sellers Elementary School, where the user's mother worked in the computer lab with Number Munchers, Crosscountry Truck Driving, and Apple IIe-era computing. Keep local-only until sourced or intentionally published.",
      "- Glendora school recollection: the user recalls that Mrs. Green was principal at the time. Keep local-only until sourced or intentionally published.",
      "- Glendora home-computing recollection: Prodigy Classic for groceries came before later internet service; the user recalls dial-up handle CHTW53C under primary account CHTW53A, then 56k V.90, CyberGate Internet, Ultimate Internet Access, and a 2Wire SDSL modem, later trying DNA Doctors Net Access and AOL coasters at university, with free dial-up and pagers remembered around fifty dollars a year. Keep local-only until sourced or intentionally published.",
      "- Glendora natural-history recollection: went bug collecting with BioQuip equipment from Dick Sweeney, including the net, jars, and transparent envelopes; exact surname may need confirmation against public Dick Swinney/Sweeney references. Keep local-only until sourced or intentionally published.",
      "- Azusa / DIMC recollection: ordained as Tae cha ta roe at Dhammakaya International Meditation Center near Monrovia Nursery, with a cemetery recollection nearby. Keep local-only until sourced or intentionally published.", 
      "- San Dimas Experimental Forest / Tanbark Flats recollection: tanbark there was used by uncle Charles Hewitt (\"Chuck\") for a horticulture class from Mount San Antonio College. Keep local-only until sourced or intentionally published.",
      "- Glendora recollection: mother gave the user a thumb sensor that changed colors from the old health food store. Keep local-only until sourced or intentionally published.",
      "- Glendora / Big Dalton work recollection: Dad worked for the street yard with Jim Henderson, then left for the water department, where closing and locking up the canyon could bring overtime pay plus a take-home vehicle and uniform service. Keep local-only until sourced or intentionally published.",
      "- Glendora / Big Dalton Canyon recollection: during Amgen Tour of California bike-race events, the bikes were parked in front of the 1803 house a couple of times and the route used the Monroe Truck Trail through Little Dalton. Keep local-only unless separately documented or intentionally published.",
      "- Family marriage recollection: Dad said his best man was Dan Bjorklund, whatever the marriage license says. Keep local-only until sourced or intentionally published.",
      "- Family organization recollection: Grandma Louise was part of the Ancient and Honorable Order of the Squirrels. Keep local-only until sourced or intentionally published.",
      "- Family recollection: Jeanie had a twin sister, but the exact identity and relationship still need clarification. Keep local-only until sourced or intentionally published.",
      "- Prom memory prompt remains local-only until sourced or intentionally published.",
      "- Sadie Hawkins memory prompt remains local-only until sourced or intentionally published."
    ];
    let changed = false;
    lines.forEach((line) => {
      if (!state.privateMemo.privateLeads.includes(line)) {
        state.privateMemo.privateLeads += `${state.privateMemo.privateLeads ? "\n" : ""}${line}`;
        changed = true;
      }
    });
    if (changed) savePrivateMemo();
  }

  function seedResearchLeadNotes() {
    const lines = [
      "Research materials checked:",
      "- Keybase profile verified: sgreeran / Steven Thomas Greeran / Wrightwood. [src-10]",
      "- Mixcloud profile verified: Steven Thomas Greeran / Wrightwood. [src-11]",
      "- UCSB Cylinder Audio Archive project staff page credits Steven Greeran in programming/interface; this is a stronger institutional lead for the UCSB technical-work period.",
      "- UCSB Library's Geospatial Collection History officially describes the Alexandria Digital Library as a UCSB Library project headquartered in the Map & Imagery Lab, which matches the resume's ADL / airphoto-work context. [src-14]",
      "- UCSB Library's Aerial Photography page documents that the geospatial collection contains more than 2.5 million aerial images and 4,500-plus flights, reinforcing the scale of the airphoto environment described in the self-published resume. [src-18]",
      "- The self-published resume specifically claims Rat Races / Santa Barbara Renaissance Pleasure Faire / Live Oak Camp participation in period dress; Live Oak Camp itself is publicly documented as a Santa Barbara County venue, and public venue context ties it to Highway 154 and the Rancho San Marcos golf-course entrance area, but companion/travel specifics remain unverified.",
      "- The Original Renaissance Pleasure Faire's official history page says the fair began in 1963 in Agoura, near Malibu, and later spent many years at the Glen Helen Pavilion in Devore before moving to Irwindale. This is a strong public place-history anchor for the user's later local-only Agoura / Glen Helen faire recollections. [src-63]",
      "- The National Park Service Paramount Ranch page places Paramount Ranch at 2903 Cornell Road in Agoura Hills and says Paramount Pictures leased the ranch in 1927, beginning a long film-production era. This gives a strong official place anchor for later local-only Paramount Ranch meeting recollections without proving who met there. [src-64]",
      "- WrightwoodCalif's Mountain Hardware live-cam page and the local KW6WW communications page give public Wrightwood context around Hwy 2, Mountain Hardware, and Table Mountain radio nets, but they do not independently place Greeran there without the self-published profile links. [src-15][src-16]", 
      "- The Foodbank of Santa Barbara County publicly confirms active volunteer operations in South County / Goleta, which supports the place context of the resume's food-bank claim without proving the individual volunteer entry by itself. [src-17]",
      "- The SGV Examiner Yumpu archive shows a Glendora-based weekly newspaper channel, and a Sept. 20–26, 2007 issue states the paper was published in Glendora, California and had been serving Los Angeles County since 1997; use this as community context, not identity proof. [src-19][src-20]",
      "- A June 5–11, 2008 SGV Examiner issue highlights Glendora High School as one of the top 5% of U.S. high schools according to Newsweek and sketches local summer civic life in Glendora; useful for scene-setting around the city and school environment, but still not person-level proof. [src-21]",
      "- Citrus College's local-history guide says the Glendora Public Library holds historical newspapers, local-school yearbooks, and the Glendoran Magazine in print and digital form, which gives a concrete follow-up path for yearbook and community-paper checking. [src-22]",
      "- The City of Glendora's Community Archive & History page says the library's searchable community archive includes scanned materials from the Glendoran Magazine, Glendora Gleaner, and more. [src-23]",
      "- The City of Glendora eLibrary page points to the OldGlendora community historical archive with the Glendoran Magazine, Glendora Gleaner, The Glendora Press, and The Glendora Signal from as early as 1850. [src-24]",
      "- Los Angeles Times' Jan. 17, 2001 API table lists Glendora High with a 2000 API of 743, statewide rank 9, similar-schools rank 6, and a 2001 target of 746. [src-25]",
      "- Los Angeles Times' Oct. 16, 2001 API table lists Glendora High with a 2001 API of 754, up 11 points from 743. [src-26]",
      "- Orange County Register's 2015 PennySaver retrospective describes PennySaver as a long-running Southern California advertising circular and notes a Glendora electrician who had advertised in it for 11 years; useful for regional commercial context, not identity proof. [src-27]",
      "- UCSB Alumni's About page says the Mosher Alumni House on Mesa Road is a central home-away-from-home for alumni, students, and the campus community. [src-28]",
      "- UCSB Alumni History traces organized alumni activity back to 1919 and says the Mosher Alumni House opened in 2007, the same year All Gaucho Reunion launched. [src-29]",
      "- The raw UCSB Alma SRU endpoint needs query parameters; the base URL returned a missing-version error in this pass, and sample SRU searches for Mosher Alumni House and Glendora High School returned zero records here, so the alumni.ucsb.edu pages were the stronger alumni-house source path than SRU for this question.",
      "- The official Glendora High School alumni reunions page provides a school contact for posting reunion information and shows reunion updates are maintained through the school site. [src-30]",
      "- A GlendoraHighSchoolAlumni.com Class of 2001 page exists with a 25-year reunion invite list and community-maintained alumni listings; useful as a lead, but still community-submitted. [src-31]",
      "- A public Classmates reunion page exists for Glendora High School's Class of 2001 reunion held Oct. 16, 2021 in Upland; because reunion pages are community-submitted and attendance lists can be stale or user-entered, treat them as soft leads rather than proof. It did, however, align with the idea that alumni-reunion resources exist for follow-up. [src-32]",
      "- A search-result-only social snippet for the handle glendora2001reunion points to an Oct. 16 reunion at 1906 Inc. / Upland Hills Country Club; treat that as a lead until directly verified on-platform.",
      "- Dick Swinney's Glendora Natural History site is a broad community archive focused on organisms and places within Glendora, explicitly including Big Dalton Canyon Wilderness Park, and it exposes dedicated insect, reptile, plant, trail, and historical-report sections that are directly useful for the Big Dalton pass. [src-33]",
      "- Dick Swinney's Butterflies of Glendora page says E. R. Hulbirt collected butterflies in Big Dalton Canyon, that Hulbirt's canyon list was submitted to H. Paul Keiser on July 21, 1949, and that Keiser was the caretaker of Big Dalton Dam and a collector of local natural-history and historical information. This is the strongest public lead in this pass connecting Big Dalton insect collecting to a named canyon caretaker. [src-34]",
      "- Dick Swinney's Reptiles of Glendora page adds later Big Dalton caretaker names: it mentions several observations by Dick Strahan near the dam and separately identifies Kevin Sweeney as BDD Caretaker in 2007 observations near the caretaker's house. Use cautiously because it is still a community compilation, but it is a concrete named lead for follow-up. [src-35]",
      "- The 1989 Glendora Wilderness Park Report hosted on the Swinney site says four of five privately leased canyon homes had been purchased, recommends a city-owned canyon residence as a future nature-center site, and says the rock house just west of the Meacham home was occupied by the Hawks family at that time. It also discusses Girl Scout / Salyer nature-center access, gates, and canyon facility planning. This is a strong Big Dalton local-history lead even though it is community-hosted. [src-36]",
      "- The 1978 Selected Items report proposes signage reading 'Girl Scout Camp 200 Yards / Glendora Day Camp / Paul Keiser Nature Trail' and recommends no collecting of plants or animals in the park without special permit, which helps frame both the Girl Scout-hut memory and the canyon collecting context. [src-37]",
      "- The current City of Glendora Trails page still lists Big Dalton Canyon Wilderness Area features as trailhead access, group campground area, picnic area, day camp facilities, and a Girl Scout Hut. [src-38]",
      "- The current City of Glendora Rowley Amphitheater page says Big Dalton Canyon Campground was formally named and added to the city's recreation list on May 10, 1985, giving a current official page that still anchors the canyon's organized civic/scout use. [src-39]",
      "- The Glendora Historical Society's museum-history page says H. Paul Keiser became the first curator and board chairman in 1947 and records that the museum project continued after his 1951 death, strengthening his public standing as a named Glendora history figure beyond the butterfly-page mention. [src-40]",
      "- The Glendora Public Library community-archive portal is now a direct official search path with 85k+ scanned pages/publications; it is a stronger archive entry point than a general web search when chasing Big Dalton names, addresses, or facilities. [src-41]",
      "- The official Glendora History Q & A page says library staff can help with person, building, address, and event questions and explicitly points researchers into the Community Archive. That gives a clean official route for asking about Big Dalton parcels, the rock house, or Meacham-related names. [src-42]",
      "- MyGlendora Mapping Solutions says users can search an address or select a parcel to view property details, making it the clearest official parcel-lookup path identified in this pass for 1803 / 2860 E. Big Dalton Canyon Rd follow-up. [src-43]",
      "- The official Water Billing page links the 2026 Water Rates Zone Map, giving a current city-maintained route to rate-zone and service-area evidence. [src-44]",
      "- The Glendora Community Plan 2025 Conservation Element says the City Water Division serves about 6,158 acres within city corporate boundaries, plus 335 acres of incorporated Los Angeles County areas, 17 acres in San Dimas, and 10 acres in Azusa; it also says Suburban Water Systems serves 485 acres inside Glendora and the City of Azusa serves 144 acres inside Glendora. That is the strongest official text in this pass showing that water service territory and city limits do not perfectly match. [src-45]",
      "- The City of Glendora Community Archive & History page says that in 1965 the City acquired all assets of the Glendora Irrigating Company, including wells in Azusa and 650 acres of Wilderness Park land in Big Dalton Canyon. This is the strongest official city-ownership clue found so far for the Big Dalton parcel/control story. [src-23]",
      "- The current Active Project List includes Rock House-Big Dalton Canyon as a city capital project in pre-design, which confirms present municipal responsibility/attention at that site. [src-46]",
      "- The official Big Dalton trail map confirms current city use of the Wren-Meacham Trail name. [src-47]",
      "- The 2025–2027 City Council Goals + Action Plan includes an action to determine whether to move forward with an annexation study of county islands on the western city border. This is not Big Dalton-specific, but it confirms that the city still actively distinguishes annexation and county-island issues in official planning. [src-48]",
      "- The City of Glendora General Plan Land Use Map explicitly shows both Sphere of Influence and Glendora City Limits. It is a useful official map layer for separating city-limit questions from broader planning-area questions. [src-53]",
      "- The USDA Forest Service San Dimas Experimental Forest overview describes the forest as a long-running Angeles National Forest research preserve and says facilities at Tanbark Flats include a laboratory or office, residences, and support buildings. This is a good official anchor for any later local-only Tanbark recollections. [src-54]",
      "- Mt. San Antonio College's Horticulture & Park Management overview confirms a standing horticulture program with hands-on field-oriented training, giving a clean official institutional anchor for later local-only Mt. SAC horticulture recollections. [src-55]",
      "- The 1803 Big Dalton Canyon Rd assessor page identifies AIN 8636-036-272 as Government Owned, Non-Exempt, Use Type Recreational, with a 1934 one-unit 1,405-square-foot two-bed/two-bath improvement and a legal description in Section 21 T1N R9W. This is the strongest official parcel-level corroboration yet for a house-like improvement on the user's recalled 1803 site. [src-56]",
      "- The 2041 Big Dalton Canyon Rd assessor page identifies AIN 8636-026-272 as Government Owned, Non-Exempt vacant land in tax rate area 04158. This matters because the City publicly uses 2041 as the Rowley/Big Dalton public-facility address while the county assessor still treats it as an unincorporated government parcel. [src-57]",
      "- The active LA County parcel-layer query for BIG DALTON CANYON RD returned only four current situs entries: 1800 (AINs 8636-036-921 and 8636-036-903), 1803 (AIN 8636-036-272), and 2041 (AIN 8636-026-272). No current 2860 situs appeared in that official parcel layer. [src-58]",
      "- The official EPIC-LA Big Dalton Canyon Road query returned county case history for 1800, 1821, 2041, and 2600 addresses. Importantly, both 1821 and 2041 point to the same AIN 8636026272, which suggests that 1821 functions as a permit or right-of-way address under the same government parcel rather than a separate residential parcel. A separate 2600 Big Dalton Canyon Road EPIC-LA record points instead to AIN 8678012902 in the City of Glendora, which distinguishes it from the 1803/2041 parcel pair. [src-59]", 
      "- Glendora's Fiscal Year 2016-2017 adopted budget says part-time positions were adjusted and added to care for the Big Dalton property. This is a useful official staffing/operations clue for the city's continuing involvement with the site, even though it still does not identify a caretaker-house history. [src-65]",
      "- LA County Public Works' Big Dalton Reservoir sediment-planning text says the reservoir was constructed in 1929 for flood risk management and water conservation, and it notes that the debris basin itself is not adjacent to residential properties even though the access route passes through residential areas. This clarifies county operational framing, but it still does not directly document a named caretaker residence. [src-66]",
      "- Glendora's Facility Documents page publicly lists separate 2024 Facility Condition Assessments for the Big Dalton Canyon Girl Scout Cabin, Big Dalton Canyon Park Campground, Big Dalton Canyon Park Daycamp-Restrooms, and Big Dalton Garage-Residences. This is the strongest official city-maintained proof recovered so far that the City actively inventories multiple distinct Big Dalton structures, including residence-type buildings. [src-67]",
      "- The official Big Dalton Canyon Girl Scout Cabin assessment says the cabin was constructed in 1970, is located across the street from the park's day camp area, and is accessed via a pedestrian bridge adjacent to the main street. This is strong official confirmation that the Girl Scout cabin is a distinct city-managed Big Dalton structure rather than only a web-page label. [src-68]",
      "- The official Big Dalton Canyon Park Campground assessment says the campground includes a wooden-framed gazebo, a small camping area, a restroom building, picnic tables, precast spectator seating, camping grills, a drinking fountain, and a pedestrian bridge by Big Dalton Canyon Road. This gives a concrete official facilities picture for the campground / amphitheater zone. [src-69]",
      "- The official Big Dalton Garage-Residences assessment says the property was built in 1934-1936, is also called \"Rock House,\" includes a garage plus two residence buildings, was previously used as a residence, has been closed and unoccupied for several years, and is planned for renovation into Parks Department office space. This is the strongest official Rock House / residence-history evidence recovered so far. [src-70]",
      "- The official Big Dalton Canyon Park Daycamp-Restrooms assessment gives a full 2041 Big Dalton Canyon Road address, says the site was developed in 1950, and identifies City of Glendora as the current occupant. That helps separate the 2041 day-camp complex from the separate Rock House / residence facility documents that do not themselves state a street number. [src-71]",
      "- Taken together, the 1934 assessor data for 1803, the city Garage-Residences / Rock House assessment built in 1934-1936, and the later CEQAnet trail filing that pairs parcel 8636036272 with the adjacent city-managed recreation parcel strongly suggest that the official Rock House facility may correspond to the same residence-era site, but the city PDF still does not state a numeric street address, so treat the match as a strong inference rather than a fully explicit official address confirmation. [src-56][src-70][src-72]", 
      "- No official city or county source recovered in this pass names 2860 Big Dalton Canyon Road as a current or historical active situs. That address remains unresolved in official records recovered so far. The newer 2600 records point to the Big Dalton Dam parcel rather than to a house parcel, so they help separate one neighboring official address without resolving 2860 itself. [src-58][src-59][src-67][src-86][src-87]", 
      "- Glendora's official Easterly Annexation District No. 77 record says the annexed territory became part of the city on November 20, 1974. A point query at nearby 1800 Big Dalton intersects that annexation record, giving a concrete official annexation anchor on the city side of the lower canyon split. [src-60]",
      "- The county legal city-boundary point query for the 1803 area returns Unincorporated County, while the nearby 1800 point query returns Glendora. This is the clearest official GIS confirmation recovered so far that adjacent lower Big Dalton sites on the same road fall on different jurisdictional sides. [src-61][src-62]",
      "- No direct official city/library record naming Ida Meacham was recovered in this pass. The clearest public mention found here remains the community Wren Meacham trail-dedication page, which says the Meachams came from Catalina to Big Dalton Canyon under a 99-year lease and that Ida Meacham still lived there in 1996. Treat it as a public lead rather than official proof. [src-52]",  
      "- The official CEQAnet Dalton Canyon Walking Trail filing lists parcel numbers 8636036272 and 8636026272 under a 2012 City of Glendora recreational trail project and labels the present land use as Conservation Open Space with Los Angeles County overlay. This is extra official evidence that the 1803 and 2041 parcel pair was already being handled together in City open-space planning, even though the filing still does not explicitly number the Rock House. [src-72]",
      "- A separate official CEQAnet filing for the Big Dalton Dam Rehabilitation Project names parcel 8678-012-902, and the Library of Congress HAER Big Dalton Dam photo index explicitly gives the dam address as 2600 Big Dalton Canyon Road. Together with the EPIC-LA 2600 case entry, this is the clearest official evidence recovered so far that 2600 is a dam/infrastructure address distinct from the 1803 and 2041 wilderness-facility parcels. [src-59][src-86][src-87]", 
      "- The City of Pasadena's Arroyo Seco page describes the Arroyo as protected parkland and open space stretching eight miles through western Pasadena with 22 miles of trails. That is solid official context for Arroyo Seco references, but it is not proof of a specific Greeran-family house. [src-73]",
      "- NAVFAC's Morris Dam history page says the Department of the Navy constructed the 20-acre Morris Dam research-and-development facility in 1943, Caltech operated it from 1943 to 1950, the Navy entered a lease with MWD on October 1, 1945 and renewed it on July 1, 1968, operations ceased in 1993, and buildings were demolished in 1997 after decades of torpedo-system testing. [src-74]",
      "- NAVFAC's Morris Dam site-description page places the former facility on a peninsula extending into the western side of Morris Reservoir about one mile north of the dam along State Highway 39 and says its primary mission was to test and evaluate Naval torpedoes. [src-75]",
      "- EPA Superfund site information identifies AEROJET ELECTROSYSTEMS CO. at 1100 W Hollyvale St, Azusa, as part of the San Gabriel Valley (Area 2) National Priorities List site. This is the clearest official Azusa Aerojet place anchor recovered so far, but it still does not tie Bernard Greeran personally to the company. [src-76]",
      "- The Library of Congress catalog hosts a HAER item for the Variable Angle Launcher Complex / Morris Dam Test Facility at Morris Reservoir, Azusa, but direct page retrieval was blocked in this environment. Treat it as a verified repository lead for future document pulls rather than a fully quoted source in this pass. [src-77]",
      "- The official Goddard Middle School handbook says sixth- and seventh-grade students are encouraged to sign up for Science Camps and says Goddard has participated in the Moka Sister City project for more than thirty years as a sister school with Moka Higashi Junior High School. This is strong official institutional context for the user's Japan-exchange and school-camp recollections, though not proof of individual attendance by itself. [src-78]",
      "- The Consulate-General of Japan in Los Angeles lists Glendora and Moka, Tochigi as sister cities established in 1988, which independently supports the official sister-city framework behind the Goddard exchange program. [src-79]",
      "- Catalina Island Marine Institute's Cherry Cove program planner shows a school-oriented residential marine-science program with snorkeling, kayaking, tidepool/plankton work, geology/ecology hikes, astronomy, squid dissection, and campfire activities. This is a strong official context match for Cherry Cove science-camp recollection without proving individual attendance. [src-80]",
      "- AstroCamp's official location page places the camp in Idyllwild at 26800 Saunders Meadow Road in the pine forest of the San Jacinto Mountains, giving a clean official anchor for the remembered Idyllwild-Pine Cove AstroCamp reference. [src-81]",
      "- The Los Angeles County Office of Education says it operates Wrightwood Outdoor Science School as a Monday-Friday residential environmental-science program for fifth- and sixth-grade students in the San Gabriel Mountains. This is a strong official context anchor for the Wrightwood science-camp recollection without proving individual attendance by itself. [src-82]",
      "- Glendora Unified's current GATE Eligibility page describes a district gifted-program pipeline using nomination, CogAT testing, multiple measures, and GATE clustered classes at elementary sites, while the district's school directory lists Sellers Elementary School at 500 N. Loraine Ave. These are useful official anchors for later local-only GATE and Sellers computer-lab recollections, but they do not independently prove a specific student's placement or a family member's job history. [src-83][src-84]",
      "- The California Highway Patrol CAD Traffic page surfaced here as a current-incident feed only. In this environment it showed live center-selection and incident-count status but did not expose a historical Big Dalton archive or searchable older report set, so treat CHP CAD as a current-monitoring lead rather than recovered archival proof in this pass. [src-85]",
      "- AEG's official 2019 Amgen Tour of California route announcement says the Ontario-to-Mt. Baldy stage descended from the backside of Glendora Mountain Road to Highway 39 and Azusa, then raced through the outskirts of Glendora before turning left back onto Glendora Mountain Road. That is a solid official public race-context anchor for the broader Big Dalton / Little Dalton foothill area, but it still does not mention Monroe Truck Trail, Little Dalton stream-bottom routing, or bikes staged at a house. [src-88]",
      "- The U.S. Geological Survey Water Data page for site 11086500 places LITTLE DALTON C NR GLENDORA CA at latitude 34.1675067 and longitude -117.8383937 with an altitude of 1334.38 feet and drainage area of 2.72 square miles. This is a strong official point anchor inside the Little Dalton corridor for later map/terrain visualization work. [src-89]",
      "- DIMC's official history page traces the center from earlier California gatherings to a formal 1992 opening and the later Azusa campus. [src-49]", 
      "- The City of Azusa public-hearing notice for the Dhammakaya Specific Plan places DIMC at 865 E. Monrovia Place on approximately 12 acres and identifies the site as a local branch center. [src-50]",
      "- The City of Azusa CEQA executive summary places the DIMC site between Palm Drive and Citrus Avenue on parcels 8625-005-015, -016, and -017, with Monrovia Nursery offices to the west and a regional detention basin to the east. These official materials verify the place context, but not the user-specific ordination identity claim. [src-51]",
      "- GitHub user greeran exists with small public technical repositories; treat as a self-published lead until identity is tied more firmly.",
      "- Stage 32 blocked by browser verification in this environment; keep as a lead, not a confirmed citation.",
      "- LinkedIn search result suggests profiles, but details were not verified here.",
      "- Avoid publishing Whitepages / MyLife / Radaris data-broker details in the book."
    ];
    let changed = false;
    lines.forEach((line) => {
      if (!state.privateMemo.publicLeads.includes(line)) {
        state.privateMemo.publicLeads += `${state.privateMemo.publicLeads ? "\n" : ""}${line}`;
        changed = true;
      }
    });
    if (changed) savePrivateMemo();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function countWords(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function projectWordCount(project) {
    return [
      project.meta.title,
      project.meta.subtitle,
      project.meta.authorLine,
      project.meta.editionNote,
      project.methodNote,
      ...project.chapters.flatMap((chapter) => [chapter.title, chapter.prompt, chapter.body])
    ].reduce((sum, value) => sum + countWords(value), 0);
  }

  function fictionLegendEntries() {
    const legend = state.fictionLegend || defaultFictionLegend();
    const entries = Array.isArray(legend.entries) ? legend.entries.filter((entry) => entry && entry.real && entry.alias) : [];
    const derived = [];
    if (legend.protagonistAlias) {
      const aliasParts = String(legend.protagonistAlias).trim().split(/\s+/).filter(Boolean);
      const firstAlias = aliasParts[0] || legend.protagonistAlias;
      const lastAlias = aliasParts[aliasParts.length - 1] || legend.protagonistAlias;
      [
        ["Steven Thomas Greeran", legend.protagonistAlias],
        ["Steven Greeran", legend.protagonistAlias],
        ["Greeran", lastAlias],
        ["Steven", firstAlias]
      ].forEach(([real, alias]) => {
        if (!entries.some((entry) => normalizeText(entry.real) === normalizeText(real))) {
          derived.push({ id: `fx-derived-${real}`, real, alias, kind: "person" });
        }
      });
    }
    const seen = new Set();
    return entries.concat(derived).filter((entry) => {
      const key = `${normalizeText(entry.real)}=>${normalizeText(entry.alias)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => b.real.length - a.real.length);
  }

  function applyFictionLegendToText(text, entries) {
    let out = String(text || "");
    (entries || []).forEach((entry) => {
      if (!entry.real || !entry.alias) return;
      out = out.replace(new RegExp(escapeRegExp(entry.real), "gi"), entry.alias);
    });
    return out;
  }

  function exportModeLabel(mode) {
    return mode === "fiction" ? "fiction veil" : "autobiography";
  }

  function currentExportMode() {
    return state.fictionLegend?.exportMode === "fiction" ? "fiction" : "autobiography";
  }

  function projectForExport(mode = currentExportMode()) {
    pullMetaControls();
    const next = ensureProjectShape(deepClone(state.project));
    if (mode !== "fiction") return next;
    const legend = state.fictionLegend || defaultFictionLegend();
    const entries = fictionLegendEntries();
    next.meta.title = legend.storyTitle || applyFictionLegendToText(next.meta.title, entries);
    next.meta.subtitle = legend.storySubtitle || applyFictionLegendToText(next.meta.subtitle, entries);
    next.meta.authorLine = legend.nomDePlume ? `By ${legend.nomDePlume}` : "Published under a nom de plume";
    next.meta.editionNote = legend.separateTimeline
      ? "Fiction veil edition · chronology preserved while identities and place names are altered"
      : "Fiction veil edition · altered names and places"
    ;
    next.methodNote = legend.separateTimeline
      ? "This fiction-side export keeps the primary timeline separate from the protagonist. Real names and places have been altered through a private legend, and the file is intended as a story scaffold rather than a literal autobiography."
      : "This fiction-side export applies a nom de plume plus altered names and places from a private legend."
    ;
    next.design.coverStamp = "FICTION VEIL";
    next.options.showEvidence = false;
    next.options.includeSources = false;
    next.sources = [];
    next.chapters = next.chapters.map((chapter) => ({
      ...chapter,
      evidence: legend.separateTimeline ? "timeline" : "story",
      title: applyFictionLegendToText(chapter.title, entries),
      prompt: applyFictionLegendToText(chapter.prompt, entries),
      body: applyFictionLegendToText(chapter.body, entries)
    }));
    return next;
  }

  function syncMetaControls() {
    $("bookTitle").value = state.project.meta.title;
    $("bookSubtitle").value = state.project.meta.subtitle;
    $("authorLine").value = state.project.meta.authorLine;
    $("editionNote").value = state.project.meta.editionNote;
    $("methodNote").value = state.project.methodNote;
    $("paperTheme").value = state.project.design.paperTheme;
    $("viewerChrome").value = state.project.design.viewerChrome;
    $("coverStamp").value = state.project.design.coverStamp;
    $("showPrompts").checked = !!state.project.options.showPrompts;
    $("showEvidence").checked = !!state.project.options.showEvidence;
    $("includeSources").checked = !!state.project.options.includeSources;
  }

  function syncPrivatePads() {
    if ($("publicLeadPad")) $("publicLeadPad").value = state.privateMemo.publicLeads || "";
    if ($("privateLeadPad")) $("privateLeadPad").value = state.privateMemo.privateLeads || "";
  }

  function syncFictionControls() {
    if ($("fictionStoryTitle")) $("fictionStoryTitle").value = state.fictionLegend.storyTitle || "";
    if ($("fictionStorySubtitle")) $("fictionStorySubtitle").value = state.fictionLegend.storySubtitle || "";
    if ($("fictionNomDePlume")) $("fictionNomDePlume").value = state.fictionLegend.nomDePlume || "";
    if ($("fictionProtagonistAlias")) $("fictionProtagonistAlias").value = state.fictionLegend.protagonistAlias || "";
    if ($("fictionSeparateTimeline")) $("fictionSeparateTimeline").checked = state.fictionLegend.separateTimeline !== false;
    if ($("sfxPrivacyMode")) $("sfxPrivacyMode").value = currentExportMode();
    if ($("magnetScenePad")) $("magnetScenePad").value = state.fictionLegend.sceneText || "";
  }

  function pullMetaControls() {
    state.project.meta.title = $("bookTitle").value;
    state.project.meta.subtitle = $("bookSubtitle").value;
    state.project.meta.authorLine = $("authorLine").value;
    state.project.meta.editionNote = $("editionNote").value;
    state.project.methodNote = $("methodNote").value;
    state.project.design.paperTheme = $("paperTheme").value;
    state.project.design.viewerChrome = $("viewerChrome").value;
    state.project.design.coverStamp = $("coverStamp").value.trim() || "WORKING EDITION";
    state.project.options.showPrompts = $("showPrompts").checked;
    state.project.options.showEvidence = $("showEvidence").checked;
    state.project.options.includeSources = $("includeSources").checked;
  }

  function currentTemplate() {
    return TEMPLATES.find((item) => item.id === state.project.templateId) || TEMPLATES[0];
  }

  function renderTemplateShelf() {
    const host = $("templateList");
    host.replaceChildren();
    TEMPLATES.forEach((template) => {
      const card = document.createElement("article");
      card.className = "template-card";
      const h3 = document.createElement("h3");
      h3.textContent = template.label;
      const p = document.createElement("p");
      p.textContent = template.description;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = state.project.templateId === template.id ? "Loaded" : "Load template";
      btn.disabled = state.project.templateId === template.id;
      btn.addEventListener("click", () => {
        const ok = window.confirm(`Replace the current draft with the “${template.label}” template?`);
        if (!ok) return;
        state.project = ensureProjectShape(template.buildProject());
        saveProject();
        renderEverything();
      });
      card.append(h3, p, btn);
      host.append(card);
    });
  }

  function fictionTrayTokens() {
    const fixed = [
      "returns", "arrives", "waits", "remembers", "hides", "watches", "writes",
      "north", "south", "coast", "camp", "library", "road", "dress", "pauper",
      "prom", "Sadie Hawkins"
    ];
    const dynamic = [
      state.fictionLegend.protagonistAlias,
      state.fictionLegend.nomDePlume,
      ...(state.fictionLegend.entries || []).flatMap((entry) => [entry.alias, entry.real]),
      ...state.project.chapters.map((chapter) => chapter.title),
      ...state.castTree.slice(0, 16).map((entry) => entry.name),
      ...allPlaces().slice(0, 20).map((place) => place.name.split(",")[0])
    ].filter(Boolean);
    const seen = new Set();
    return fixed.concat(dynamic).filter((token) => {
      const key = normalizeText(token);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 72);
  }

  function renderFictionLab() {
    syncFictionControls();
    const legendHost = $("fictionLegendList");
    const trayHost = $("magnetTray");
    const boardHost = $("magnetBoard");
    const scenePad = $("magnetScenePad");
    if (!legendHost || !trayHost || !boardHost || !scenePad) return;

    legendHost.replaceChildren();
    if (!state.fictionLegend.entries.length) {
      const empty = document.createElement("small");
      empty.className = "magnet-empty";
      empty.textContent = "No alias entries yet. Add a real name/place and its fiction alias to build the legend.";
      legendHost.append(empty);
    } else {
      state.fictionLegend.entries.forEach((entry) => {
        const card = document.createElement("article");
        card.className = "fiction-legend-card";
        const head = document.createElement("div");
        head.className = "fiction-legend-head";
        const title = document.createElement("div");
        const b = document.createElement("b");
        b.textContent = `${entry.real} → ${entry.alias}`;
        const small = document.createElement("small");
        small.textContent = entry.kind;
        title.append(b, small);
        const kind = document.createElement("span");
        kind.className = "fiction-legend-kind";
        kind.textContent = entry.kind;
        head.append(title, kind);
        const actions = document.createElement("div");
        actions.className = "fiction-legend-actions";
        const aliasBtn = document.createElement("button");
        aliasBtn.type = "button";
        aliasBtn.textContent = "Alias magnet";
        aliasBtn.addEventListener("click", () => {
          state.fictionLegend.boardTokens.push(entry.alias);
          saveFictionLegend();
          renderFictionLab();
        });
        const realBtn = document.createElement("button");
        realBtn.type = "button";
        realBtn.textContent = "Real magnet";
        realBtn.addEventListener("click", () => {
          state.fictionLegend.boardTokens.push(entry.real);
          saveFictionLegend();
          renderFictionLab();
        });
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "Delete";
        removeBtn.addEventListener("click", () => {
          state.fictionLegend.entries = state.fictionLegend.entries.filter((item) => item.id !== entry.id);
          saveFictionLegend();
          renderFictionLab();
          queuePreviewRefresh();
        });
        actions.append(aliasBtn, realBtn, removeBtn);
        card.append(head, actions);
        legendHost.append(card);
      });
    }

    trayHost.replaceChildren();
    fictionTrayTokens().forEach((token) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "magnet-chip";
      chip.textContent = token;
      chip.addEventListener("click", () => {
        state.fictionLegend.boardTokens.push(token);
        saveFictionLegend();
        renderFictionLab();
      });
      trayHost.append(chip);
    });

    boardHost.replaceChildren();
    if (!state.fictionLegend.boardTokens.length) {
      const empty = document.createElement("small");
      empty.className = "magnet-empty";
      empty.textContent = "Drop or click magnets here to assemble a fiction-side line.";
      boardHost.append(empty);
    } else {
      state.fictionLegend.boardTokens.forEach((token, index) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "magnet-board-item";
        chip.textContent = token;
        chip.draggable = true;
        chip.addEventListener("click", () => {
          state.fictionLegend.boardTokens.splice(index, 1);
          saveFictionLegend();
          renderFictionLab();
        });
        chip.addEventListener("dragstart", (event) => {
          state.dragMagnetIndex = index;
          chip.classList.add("dragging");
          event.dataTransfer.effectAllowed = "move";
          try { event.dataTransfer.setData("text/plain", String(index)); } catch (_) {}
        });
        chip.addEventListener("dragend", () => {
          state.dragMagnetIndex = null;
          $$(".magnet-board-item").forEach((el) => el.classList.remove("dragging", "drag-target"));
        });
        chip.addEventListener("dragover", (event) => {
          event.preventDefault();
          if (state.dragMagnetIndex == null || state.dragMagnetIndex === index) return;
          chip.classList.add("drag-target");
        });
        chip.addEventListener("dragleave", () => {
          chip.classList.remove("drag-target");
        });
        chip.addEventListener("drop", (event) => {
          event.preventDefault();
          chip.classList.remove("drag-target");
          const from = state.dragMagnetIndex;
          if (from == null || from === index) return;
          const [item] = state.fictionLegend.boardTokens.splice(from, 1);
          state.fictionLegend.boardTokens.splice(index, 0, item);
          saveFictionLegend();
          renderFictionLab();
        });
        boardHost.append(chip);
      });
    }

    if (!state.fictionLegend.sceneText) {
      scenePad.value = state.fictionLegend.boardTokens.join(" ");
    }
  }

  function renderChapterList() {
    const host = $("chapterList");
    host.replaceChildren();
    state.project.chapters.forEach((chapter, index) => {
      ensureChapterShape(chapter);
      const card = document.createElement("article");
      card.className = "chapter-card";
      card.draggable = true;
      card.dataset.index = String(index);

      const head = document.createElement("div");
      head.className = "chapter-head";
      const titleWrap = document.createElement("div");
      const heading = document.createElement("h3");
      heading.textContent = `Chapter ${String(index + 1).padStart(2, "0")}`;
      const layoutNote = document.createElement("div");
      layoutNote.className = "chapter-layout-note";
      layoutNote.textContent = `page · ${(chapter.layout || "chapter").toUpperCase()}`;
      titleWrap.append(heading, layoutNote);

      const tools = document.createElement("div");
      tools.className = "chapter-tools";
      [
        { label: "Map", title: "Show linked places on map", act: () => focusChapterOnMap(index) },
        { label: "↑", title: "Move up", act: () => moveChapter(index, -1) },
        { label: "↓", title: "Move down", act: () => moveChapter(index, 1) },
        { label: "Copy", title: "Duplicate chapter", act: () => duplicateChapter(index) },
        { label: "Delete", title: "Delete chapter", act: () => deleteChapter(index) }
      ].forEach((spec) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = spec.label;
        button.title = spec.title;
        button.addEventListener("click", spec.act);
        tools.append(button);
      });

      head.append(titleWrap, tools);

      const meta = document.createElement("div");
      meta.className = "chapter-meta";

      const titleLabel = document.createElement("label");
      const titleSpan = document.createElement("span");
      titleSpan.textContent = "Title";
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = chapter.title;
      titleInput.addEventListener("input", () => {
        chapter.title = titleInput.value;
        onProjectEdit();
      });
      titleLabel.append(titleSpan, titleInput);

      const evidenceLabel = document.createElement("label");
      const evidenceSpan = document.createElement("span");
      evidenceSpan.textContent = "Evidence lane";
      const evidenceSelect = document.createElement("select");
      ["official", "reporting", "self-published", "editorial", "prompt", "private prompt"].forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        option.selected = chapter.evidence === value;
        evidenceSelect.append(option);
      });
      evidenceSelect.addEventListener("change", () => {
        chapter.evidence = evidenceSelect.value;
        onProjectEdit();
      });
      evidenceLabel.append(evidenceSpan, evidenceSelect);

      const layoutLabel = document.createElement("label");
      const layoutSpan = document.createElement("span");
      layoutSpan.textContent = "Page type";
      const layoutSelect = document.createElement("select");
      [["chapter", "Standard chapter"], ["cover", "Cover page"], ["divider", "Divider page"]].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = (chapter.layout || "chapter") === value;
        layoutSelect.append(option);
      });
      layoutSelect.addEventListener("change", () => {
        chapter.layout = layoutSelect.value;
        onProjectEdit(true);
      });
      layoutLabel.append(layoutSpan, layoutSelect);

      meta.append(titleLabel, evidenceLabel, layoutLabel);

      const promptLabel = document.createElement("label");
      const promptSpan = document.createElement("span");
      promptSpan.textContent = "Prompt";
      const promptInput = document.createElement("textarea");
      promptInput.rows = 3;
      promptInput.value = chapter.prompt;
      promptInput.addEventListener("input", () => {
        chapter.prompt = promptInput.value;
        onProjectEdit();
      });
      promptLabel.append(promptSpan, promptInput);

      const bodyLabel = document.createElement("label");
      bodyLabel.className = "chapter-body";
      const bodySpan = document.createElement("span");
      bodySpan.textContent = "Body";
      const bodyInput = document.createElement("textarea");
      bodyInput.rows = 9;
      bodyInput.value = chapter.body;
      bodyInput.addEventListener("input", () => {
        chapter.body = bodyInput.value;
        onProjectEdit();
      });
      bodyLabel.append(bodySpan, bodyInput);

      const picker = document.createElement("div");
      picker.className = "chapter-place-picker";
      const pickerTitle = document.createElement("h4");
      pickerTitle.textContent = "Linked places";
      const autoIds = inferChapterPlaceIds(chapter);
      const manualIds = ensureChapterPlaceIds(chapter);
      const pickerActions = document.createElement("div");
      pickerActions.className = "chapter-place-actions";
      const autoButton = document.createElement("button");
      autoButton.type = "button";
      autoButton.textContent = "Auto-fill";
      autoButton.addEventListener("click", () => {
        chapter.placeIds = [...autoIds];
        onProjectEdit(true);
      });
      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.textContent = "Clear tags";
      clearButton.addEventListener("click", () => {
        chapter.placeIds = [];
        onProjectEdit(true);
      });
      pickerActions.append(autoButton, clearButton);
      const chipGrid = document.createElement("div");
      chipGrid.className = "chapter-chip-grid";
      allPlaces().forEach((place) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chapter-chip";
        const active = manualIds.includes(place.id);
        chip.classList.toggle("active", active);
        chip.textContent = place.name;
        chip.style.borderColor = active ? laneColor(place.lane) : "";
        chip.addEventListener("click", () => {
          const next = ensureChapterPlaceIds(chapter);
          const idx = next.indexOf(place.id);
          if (idx >= 0) next.splice(idx, 1);
          else next.push(place.id);
          onProjectEdit(true);
        });
        chipGrid.append(chip);
      });
      const pickerNote = document.createElement("small");
      pickerNote.textContent = manualIds.length
        ? `Manual tags active: ${manualIds.length} place${manualIds.length === 1 ? "" : "s"}.`
        : autoIds.length
          ? `Auto-detected suggestions: ${autoIds.map((id) => allPlaces().find((place) => place.id === id)?.name || id).join(", ")}.`
          : "No place suggestions detected from chapter text yet.";
      picker.append(pickerTitle, pickerActions, chipGrid, pickerNote);

      card.addEventListener("dragstart", (event) => {
        state.dragChapterIndex = index;
        card.classList.add("dragging");
        event.dataTransfer.effectAllowed = "move";
        try { event.dataTransfer.setData("text/plain", String(index)); } catch (_) {}
      });
      card.addEventListener("dragend", () => {
        state.dragChapterIndex = null;
        document.querySelectorAll(".chapter-card").forEach((el) => el.classList.remove("dragging", "drag-target"));
      });
      card.addEventListener("dragover", (event) => {
        event.preventDefault();
        if (state.dragChapterIndex == null || state.dragChapterIndex === index) return;
        card.classList.add("drag-target");
      });
      card.addEventListener("dragleave", () => {
        card.classList.remove("drag-target");
      });
      card.addEventListener("drop", (event) => {
        event.preventDefault();
        card.classList.remove("drag-target");
        const from = state.dragChapterIndex;
        if (from == null || from === index) return;
        reorderChapter(from, index);
      });

      card.append(head, meta, promptLabel, bodyLabel, picker);
      host.append(card);
    });
  }

  function addChapter() {
    state.project.chapters.push(
      makeChapter(
        "New chapter",
        "What should this chapter ask for or verify?",
        "prompt",
        "Write here. Keep published fact, self-published material, and private recollection clearly labeled."
      )
    );
    onProjectEdit(true);
  }

  function moveChapter(index, delta) {
    const next = index + delta;
    if (next < 0 || next >= state.project.chapters.length) return;
    const [item] = state.project.chapters.splice(index, 1);
    state.project.chapters.splice(next, 0, item);
    onProjectEdit(true);
  }

  function reorderChapter(from, to) {
    if (from === to || from == null || to == null) return;
    const [item] = state.project.chapters.splice(from, 1);
    state.project.chapters.splice(to, 0, item);
    if (state.selectedChapterIndex === from) state.selectedChapterIndex = to;
    else if (state.selectedChapterIndex != null) {
      if (from < state.selectedChapterIndex && to >= state.selectedChapterIndex) state.selectedChapterIndex -= 1;
      if (from > state.selectedChapterIndex && to <= state.selectedChapterIndex) state.selectedChapterIndex += 1;
    }
    onProjectEdit(true);
  }

  function duplicateChapter(index) {
    state.project.chapters.splice(index + 1, 0, deepClone(state.project.chapters[index]));
    onProjectEdit(true);
  }

  function deleteChapter(index) {
    if (state.project.chapters.length === 1) {
      window.alert("The book needs at least one chapter.");
      return;
    }
    if (!window.confirm("Delete this chapter?")) return;
    state.project.chapters.splice(index, 1);
    onProjectEdit(true);
  }

  function ensureChapterPlaceIds(chapter) {
    if (!Array.isArray(chapter.placeIds)) chapter.placeIds = [];
    return chapter.placeIds;
  }

  function ensureChapterShape(chapter) {
    ensureChapterPlaceIds(chapter);
    if (!["chapter", "cover", "divider"].includes(chapter.layout)) chapter.layout = "chapter";
    return chapter;
  }

  function normalizeText(value) {
    return String(value || "").toLowerCase();
  }

  function parseMilestoneCastNames(value) {
    const seen = new Set();
    return (Array.isArray(value) ? value : String(value || "").split(/\s*,\s*|\n+/))
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .filter((item) => {
        const key = normalizeText(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function milestoneCategory(value, entry = null) {
    const direct = normalizeText(value).replace(/\s+/g, "-");
    if (["wedding-ceremony", "school-dance-reunion", "other"].includes(direct)) return direct;
    const source = normalizeText([
      entry?.title,
      entry?.era,
      entry?.place,
      entry?.people,
      entry?.note
    ].filter(Boolean).join(" "));
    if (/(wedding|married|ceremony|graduation|graduate|commencement)/.test(source)) return "wedding-ceremony";
    if (/(prom|sadie|dance|homecoming|reunion)/.test(source)) return "school-dance-reunion";
    return "other";
  }

  function milestoneCategoryLabel(value) {
    return ({
      "wedding-ceremony": "Weddings / ceremonies",
      "school-dance-reunion": "School dances / reunions",
      other: "Other local-only memory"
    })[milestoneCategory(value)] || "Other local-only memory";
  }

  function milestoneCategoryColor(value) {
    return ({
      "wedding-ceremony": "#f2c984",
      "school-dance-reunion": "#b996ff",
      other: "#8ce8dc"
    })[milestoneCategory(value)] || "#8ce8dc";
  }

  function humanizeToken(value) {
    return String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function parseCoordinateText(value) {
    const cleaned = String(value || "")
      .replace(/^geo:/i, "")
      .replace(/[()]/g, "")
      .replace(/°/g, "")
      .trim();
    if (!cleaned) return null;
    const parts = cleaned.split(",").map((part) => Number(part.trim()));
    if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
    return { lat: parts[0], lon: parts[1] };
  }

  function parseCoordinateValue(value) {
    if (!value) return null;
    if (typeof value === "string") return parseCoordinateText(value);
    if (typeof value === "object") {
      if (typeof value.latLng === "string") return parseCoordinateText(value.latLng);
      if (Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng))) {
        return { lat: Number(value.lat), lon: Number(value.lng) };
      }
      if (Number.isFinite(Number(value.latitude)) && Number.isFinite(Number(value.longitude))) {
        return { lat: Number(value.latitude), lon: Number(value.longitude) };
      }
      if (Number.isFinite(Number(value.latE7)) && Number.isFinite(Number(value.lngE7))) {
        return { lat: Number(value.latE7) / 1e7, lon: Number(value.lngE7) / 1e7 };
      }
      if (Number.isFinite(Number(value.latitudeE7)) && Number.isFinite(Number(value.longitudeE7))) {
        return { lat: Number(value.latitudeE7) / 1e7, lon: Number(value.longitudeE7) / 1e7 };
      }
    }
    return null;
  }

  function parseTimestampValue(value) {
    if (value == null || value === "") return "";
    if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString();
    const text = String(value).trim();
    if (!text) return "";
    if (/^\d+$/.test(text)) {
      const num = Number(text);
      return Number.isFinite(num) ? new Date(num).toISOString() : text;
    }
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString();
  }

  function shortDate(value) {
    const parsed = new Date(value || "");
    if (Number.isNaN(parsed.getTime())) return String(value || "");
    return parsed.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  }

  function shortDateTime(value) {
    const parsed = new Date(value || "");
    if (Number.isNaN(parsed.getTime())) return String(value || "");
    return parsed.toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function dedupePathPoints(points) {
    const out = [];
    let lastKey = "";
    (points || []).forEach((point) => {
      if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return;
      const key = `${point.lat.toFixed(6)},${point.lon.toFixed(6)}`;
      if (key === lastKey) return;
      out.push({ lat: point.lat, lon: point.lon, time: point.time || "" });
      lastKey = key;
    });
    return out;
  }

  function samplePathPoints(points, limit = 72) {
    const clean = dedupePathPoints(points);
    if (clean.length <= limit) return clean;
    const out = [];
    for (let i = 0; i < limit; i += 1) {
      const index = Math.round((i * (clean.length - 1)) / Math.max(1, limit - 1));
      out.push(clean[index]);
    }
    return dedupePathPoints(out);
  }

  function formatCsvCell(value) {
    const text = String(value == null ? "" : value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function kmlEscape(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function findPlaceByAlias(value) {
    const needle = normalizeText(value);
    if (!needle) return null;
    return allPlaces().find((place) => placeAliases(place).some((alias) => alias === needle)) || null;
  }

  function findCastEntryByName(value) {
    const needle = normalizeText(String(value || "").trim());
    if (!needle) return null;
    return (state.castTree || []).find((entry) => normalizeText(entry.name) === needle) || null;
  }

  function placeAliases(place) {
    const base = [normalizeText(place.name), normalizeText(place.id)];
    const extra = {
      "pasadena-private": ["pasadena", "huntington", "origin"],
      glendora: ["glendora", "glendora high", "bioquip", "bug collecting", "transparent envelopes"],
      "sellers-elementary": ["sellers elementary", "sellers elementary school", "gate", "g.a.t.e.", "gifted and talented", "number munchers", "number munchies", "crosscountry truck driving", "apple iie", "mrs. green"],
      duarte: ["duarte"],
      "san-dimas": ["san dimas"],
      pomona: ["pomona", "cal poly pomona"],
      goleta: ["goleta", "live oak camp", "rat races", "renaissance pleasure faire", "renaissance faire"],
      "paramount-ranch": ["paramount ranch", "agoura", "agoura hills", "cornell road", "original renaissance pleasure faire"],
      "glen-helen-devore": ["glen helen", "glen helen pavilion", "devore"],
      "freedom-acres-private": ["freedom acres", "deer park", "deer park nudist resort"],
      "lakewood-co-private": ["lakewood, colorado", "lakewood co", "lakewood, co", "colorado", "radeon basement"],
      "glendora-home-computing-private": ["prodigy", "prodigy classic", "chtw53a", "chtw53c", "56k", "v.90", "cybergate", "cyber gate", "ultimate internet access", "sdsl", "2wire", "dna doctors net access", "aol coasters", "dialup", "pager", "pagers"],
      "arroyo-seco-official": ["arroyo seco", "the arroyo", "lower arroyo", "central arroyo", "pasadena arroyo"],
      "azusa-canyon-morris-dam": ["azusa canyon", "morris dam", "morris reservoir", "morris dam test facility", "variable angle launcher", "torpedo testing", "nccosc", "nots"],
      "aerojet-azusa-official": ["aerojet", "aerojet azusa", "aerojet electrosystems", "1100 w hollyvale", "hollyvale", "aerojet drive", "301 aerojet"],
      "moka-higashi-japan": ["moka", "moka japan", "moka higashi", "moka higashi junior high", "mola higahashi", "sister cities international"],
      "catalina-cherry-cove": ["catalina island", "cimi", "catalina island marine institute", "cherry cove", "cimi valley cherry cove"],
      "astrocamp-idyllwild": ["astrocamp", "astro camp", "idyllwild", "idyllwild-pine cove", "pine cove", "idywyld", "pinecone"],
      "wrightwood-outdoor-science-school": ["wrightwood science camp", "science camp in wrightwood", "wrightwood outdoor science school", "outdoor science school"],
      "santa-barbara": ["santa barbara", "ucsb", "davidson library", "alexandria digital library"],
      wrightwood: ["wrightwood", "wrightwood outdoor science school"],
      "azusa-dimc": ["azusa", "dhammakaya", "dhammakaya international meditation center", "dimc", "monrovia place", "palm drive", "citrus avenue"],
      "san-dimas-experimental-forest": ["san dimas experimental forest", "experimental forest", "sdef", "tanbark", "tanbark flats", "mount san antonio college", "mt sac", "horticulture"],
      "independence-private": ["independence", "missouri", "science mountain", "science.edu", "international academy of science"],
      "st-croix": ["st croix", "st. croix", "virgin islands", "usvi"],
      frederiksted: ["frederiksted", "midre cummings park"]
    }[place.id] || [];
    return [...new Set(base.concat(extra).filter(Boolean))];
  }

  function allPlaces() {
    return RESEARCH_PLACES.concat(state.localPins || [], state.googleTimeline?.places || []);
  }

  function buildGoogleTimelineImport(records, fileNames) {
    const placeMap = new Map();
    const events = [];
    const paths = [];
    const formats = new Set();
    let visitCount = 0;
    let activityCount = 0;
    let pathSegments = 0;
    let pathPointCount = 0;

    function upsertPlace(name, coords, startTime, endTime, note) {
      if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lon)) return "";
      const label = String(name || "Timeline place").trim() || "Timeline place";
      const key = `${normalizeText(label)}|${coords.lat.toFixed(4)}|${coords.lon.toFixed(4)}`;
      const seenStart = parseTimestampValue(startTime);
      const seenEnd = parseTimestampValue(endTime);
      let place = placeMap.get(key);
      if (!place) {
        place = {
          id: `gtl-${placeMap.size + 1}`,
          name: label,
          lat: coords.lat,
          lon: coords.lon,
          lane: "private",
          source: "google timeline import",
          exportable: false,
          summary: "Local-only place imported from Google Timeline.",
          hits: 0,
          firstSeen: seenStart || seenEnd || "",
          lastSeen: seenEnd || seenStart || ""
        };
        placeMap.set(key, place);
      }
      place.hits += 1;
      if (seenStart && (!place.firstSeen || seenStart < place.firstSeen)) place.firstSeen = seenStart;
      if (seenEnd && (!place.lastSeen || seenEnd > place.lastSeen)) place.lastSeen = seenEnd;
      const parts = [
        "Local-only place imported from Google Timeline.",
        `${place.hits} visit${place.hits === 1 ? "" : "s"}`
      ];
      if (place.firstSeen || place.lastSeen) {
        parts.push(`Seen ${shortDate(place.firstSeen || place.lastSeen)} → ${shortDate(place.lastSeen || place.firstSeen)}`);
      }
      if (note) parts.push(note);
      place.summary = parts.join(" · ");
      return place.id;
    }

    function pushPath(label, points, startTime, endTime, sourceFile, mode, note) {
      const sampled = samplePathPoints(points);
      if (sampled.length < 2) return "";
      pathPointCount += sampled.length;
      const path = {
        id: `gtl-path-${paths.length + 1}`,
        label: String(label || "Timeline route"),
        mode: String(mode || "Movement"),
        note: String(note || ""),
        lane: "private",
        startTime: parseTimestampValue(startTime),
        endTime: parseTimestampValue(endTime),
        sourceFile: String(sourceFile || ""),
        points: sampled.map((point) => ({ lat: point.lat, lon: point.lon, time: parseTimestampValue(point.time) }))
      };
      paths.push(path);
      return path.id;
    }

    function pushEvent(label, note, startTime, endTime, placeId, sourceFile, routeId) {
      events.push({
        id: `gtl-event-${events.length + 1}`,
        placeId: placeId || "",
        routeId: routeId || "",
        label: String(label || "Timeline event"),
        note: String(note || ""),
        lane: "private",
        startTime: parseTimestampValue(startTime),
        endTime: parseTimestampValue(endTime),
        sourceFile: String(sourceFile || "")
      });
    }

    function ingestSemanticSegments(segments, sourceFile) {
      formats.add("semanticSegments");
      segments.forEach((segment) => {
        if (!segment || typeof segment !== "object") return;
        const startTime = segment.startTime;
        const endTime = segment.endTime;
        const visit = segment.visit?.topCandidate;
        if (visit?.placeLocation?.latLng) {
          visitCount += 1;
          const coords = parseCoordinateValue(visit.placeLocation);
          const semanticType = humanizeToken(visit.semanticType || "Visit");
          const probability = Number(visit.probability);
          const confidence = Number.isFinite(probability) ? `confidence ${Math.round(probability * 100)}%` : "";
          const placeId = upsertPlace(semanticType, coords, startTime, endTime, confidence);
          pushEvent(
            `${shortDate(startTime || endTime)} · ${semanticType}`,
            [confidence, "Google Timeline visit", sourceFile].filter(Boolean).join(" · "),
            startTime,
            endTime,
            placeId,
            sourceFile,
            ""
          );
        }

        const activity = segment.activity;
        const pathPoints = Array.isArray(segment.timelinePath)
          ? segment.timelinePath.map((point) => {
            const coords = parseCoordinateValue(point?.point || point?.latLng || point);
            return coords ? { ...coords, time: point?.time || point?.timestamp || "" } : null;
          }).filter(Boolean)
          : [];
        const activityPoints = [
          activity?.start?.latLng ? { ...(parseCoordinateValue(activity.start) || {}), time: startTime } : null,
          activity?.end?.latLng ? { ...(parseCoordinateValue(activity.end) || {}), time: endTime } : null,
          activity?.parking?.location?.latLng ? { ...(parseCoordinateValue(activity.parking.location) || {}), time: endTime } : null
        ].filter((point) => point && Number.isFinite(point.lat) && Number.isFinite(point.lon));
        const routePoints = pathPoints.length > 1 ? pathPoints : (activityPoints.length > 1 ? activityPoints : pathPoints);
        if (routePoints.length > 1) {
          const kind = humanizeToken(activity?.topCandidate?.type || activity?.type || (pathPoints.length ? "Path segment" : "Movement"));
          const routeId = pushPath(
            `${shortDate(startTime || endTime)} · ${kind}`,
            routePoints,
            startTime,
            endTime,
            sourceFile,
            kind,
            pathPoints.length ? `${pathPoints.length} raw path points` : "start/end activity path"
          );
          if (routeId) {
            if (pathPoints.length) pathSegments += 1;
            if (activity) activityCount += 1;
            pushEvent(
              `${shortDate(startTime || endTime)} · ${kind}`,
              [pathPoints.length ? `${pathPoints.length} path point${pathPoints.length === 1 ? "" : "s"}` : "Google Timeline activity", sourceFile].filter(Boolean).join(" · "),
              startTime,
              endTime,
              "",
              sourceFile,
              routeId
            );
          }
        } else if (activity?.start?.latLng || activity?.end?.latLng) {
          activityCount += 1;
          const kind = humanizeToken(activity.topCandidate?.type || activity.type || "Movement");
          pushEvent(
            `${shortDate(startTime || endTime)} · ${kind}`,
            ["Google Timeline activity", sourceFile].filter(Boolean).join(" · "),
            startTime,
            endTime,
            "",
            sourceFile,
            ""
          );
        } else if (pathPoints.length) {
          pathSegments += 1;
          pushEvent(
            `${shortDate(startTime || endTime)} · Path segment`,
            [`${pathPoints.length} path point${pathPoints.length === 1 ? "" : "s"}`, sourceFile].filter(Boolean).join(" · "),
            startTime,
            endTime,
            "",
            sourceFile,
            ""
          );
        }
      });
    }

    function ingestTimelineObjects(objects, sourceFile) {
      formats.add("timelineObjects");
      objects.forEach((item) => {
        if (!item || typeof item !== "object") return;
        if (item.placeVisit?.location) {
          visitCount += 1;
          const visit = item.placeVisit;
          const location = visit.location;
          const startTime = visit.duration?.startTimestamp || visit.duration?.startTimestampMs;
          const endTime = visit.duration?.endTimestamp || visit.duration?.endTimestampMs;
          const coords = parseCoordinateValue(location);
          const name = location.name || location.address || humanizeToken(location.semanticType || "Place visit");
          const confidence = visit.placeConfidence || visit.visitConfidence || location.locationConfidence || "";
          const placeId = upsertPlace(name, coords, startTime, endTime, confidence ? `confidence ${confidence}` : "");
          pushEvent(
            `${shortDate(startTime || endTime)} · ${name}`,
            [confidence ? `confidence ${confidence}` : "", location.address, sourceFile].filter(Boolean).join(" · "),
            startTime,
            endTime,
            placeId,
            sourceFile,
            ""
          );
        }
        if (item.activitySegment) {
          activityCount += 1;
          const segment = item.activitySegment;
          const startTime = segment.duration?.startTimestamp || segment.duration?.startTimestampMs;
          const endTime = segment.duration?.endTimestamp || segment.duration?.endTimestampMs;
          const kind = humanizeToken(segment.activityType || segment.activities?.[0]?.activityType || segment.waypointPath?.travelMode || "Movement");
          const routePoints = [
            parseCoordinateValue(segment.startLocation),
            ...(Array.isArray(segment.waypointPath?.waypoints) ? segment.waypointPath.waypoints.map((point) => parseCoordinateValue(point)) : []),
            ...(Array.isArray(segment.simplifiedRawPath?.points) ? segment.simplifiedRawPath.points.map((point) => parseCoordinateValue(point)) : []),
            parseCoordinateValue(segment.endLocation)
          ].filter(Boolean).map((point) => ({ ...point }));
          const routeId = pushPath(
            `${shortDate(startTime || endTime)} · ${kind}`,
            routePoints,
            startTime,
            endTime,
            sourceFile,
            kind,
            [segment.distance ? `${segment.distance} m` : "", segment.waypointPath?.source || segment.simplifiedRawPath?.source || ""].filter(Boolean).join(" · ")
          );
          if (routeId) pathSegments += 1;
          pushEvent(
            `${shortDate(startTime || endTime)} · ${kind}`,
            [`${segment.distance || 0} m`, sourceFile].filter(Boolean).join(" · "),
            startTime,
            endTime,
            "",
            sourceFile,
            routeId
          );
        }
      });
    }

    records.forEach(({ data, fileName }) => {
      if (Array.isArray(data)) {
        const looksLikeTimelineObjects = data.some((item) => item && typeof item === "object" && (item.placeVisit || item.activitySegment));
        if (looksLikeTimelineObjects) ingestTimelineObjects(data, fileName);
        else ingestSemanticSegments(data, fileName);
        return;
      }
      if (data && Array.isArray(data.semanticSegments)) {
        ingestSemanticSegments(data.semanticSegments, fileName);
      }
      if (data && Array.isArray(data.timelineObjects)) {
        ingestTimelineObjects(data.timelineObjects, fileName);
      }
    });

    const allPlacesImported = Array.from(placeMap.values())
      .sort((a, b) => (b.hits - a.hits) || String(b.lastSeen).localeCompare(String(a.lastSeen)));
    const allPathsImported = paths
      .sort((a, b) => String(b.startTime || b.endTime).localeCompare(String(a.startTime || a.endTime)));
    const keptPlaces = allPlacesImported.slice(0, 250);
    const keptPaths = allPathsImported.slice(0, 96);
    const keptPathIds = new Set(keptPaths.map((path) => path.id));
    const keptPlaceIds = new Set(keptPlaces.map((place) => place.id));
    const allEventsImported = events
      .sort((a, b) => String(b.startTime || b.endTime).localeCompare(String(a.startTime || a.endTime)));
    const keptEvents = allEventsImported.slice(0, 240).map((event) => ({
      ...event,
      placeId: keptPlaceIds.has(event.placeId) ? event.placeId : "",
      routeId: keptPathIds.has(event.routeId) ? event.routeId : ""
    }));

    return {
      files: fileNames,
      importedAt: nowIso(),
      places: keptPlaces,
      events: keptEvents,
      paths: keptPaths,
      stats: {
        formats: Array.from(formats),
        files: fileNames.length,
        visits: visitCount,
        activities: activityCount,
        pathSegments,
        routeCount: keptPaths.length,
        pathPointCount,
        placeCount: keptPlaces.length,
        eventCount: keptEvents.length,
        rawPlaceCount: allPlacesImported.length,
        rawEventCount: allEventsImported.length,
        rawRouteCount: allPathsImported.length
      }
    };
  }

  function readFileAsText(file) {
    if (file && typeof file.text === "function") return file.text();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error("Could not read file."));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsText(file);
    });
  }

  async function importGoogleTimelineFiles(files) {
    const records = [];
    for (const file of files) {
      const text = await readFileAsText(file);
      records.push({ data: JSON.parse(text), fileName: file.name || "location-history.json" });
    }
    const imported = buildGoogleTimelineImport(records, files.map((file) => file.name || "location-history.json"));
    if (!imported.stats.rawPlaceCount && !imported.stats.rawEventCount && !imported.stats.rawRouteCount) {
      throw new Error("No supported Google Timeline visits or activity segments were found in the selected JSON file(s).");
    }
    return imported;
  }

  function exportGoogleTimelineCsv() {
    const data = state.googleTimeline || emptyGoogleTimeline();
    if (!data.events.length && !data.places.length && !data.paths.length) {
      window.alert("Import Google Timeline data first.");
      return;
    }
    const placeById = new Map((data.places || []).map((place) => [place.id, place]));
    const pathById = new Map((data.paths || []).map((path) => [path.id, path]));
    const rows = [[
      "type",
      "label",
      "startTime",
      "endTime",
      "placeName",
      "latitude",
      "longitude",
      "routePointCount",
      "sourceFile",
      "note"
    ]];
    data.events.forEach((event) => {
      const place = placeById.get(event.placeId);
      const path = pathById.get(event.routeId);
      rows.push([
        path ? "route-event" : place ? "visit-event" : "event",
        event.label,
        event.startTime,
        event.endTime,
        place?.name || "",
        place?.lat ?? "",
        place?.lon ?? "",
        path?.points?.length || "",
        event.sourceFile,
        event.note
      ]);
    });
    data.places.forEach((place) => {
      rows.push([
        "place",
        place.name,
        place.firstSeen,
        place.lastSeen,
        place.name,
        place.lat,
        place.lon,
        "",
        "google timeline import",
        place.summary
      ]);
    });
    data.paths.forEach((path) => {
      rows.push([
        "route",
        path.label,
        path.startTime,
        path.endTime,
        "",
        path.points[0]?.lat ?? "",
        path.points[0]?.lon ?? "",
        path.points.length,
        path.sourceFile,
        path.note
      ]);
    });
    const csv = rows.map((row) => row.map(formatCsvCell).join(",")).join("\n");
    downloadText(`google-timeline-${slugify(state.project.meta.title)}.csv`, csv, "text/csv");
  }

  function exportGoogleTimelineKml() {
    const data = state.googleTimeline || emptyGoogleTimeline();
    if (!data.events.length && !data.places.length && !data.paths.length) {
      window.alert("Import Google Timeline data first.");
      return;
    }
    const placemarks = [];
    data.places.forEach((place) => {
      placemarks.push(
        `<Placemark><name>${kmlEscape(place.name)}</name><description>${kmlEscape(place.summary || "Local-only imported place")}</description><Point><coordinates>${place.lon},${place.lat},0</coordinates></Point></Placemark>`
      );
    });
    data.paths.forEach((path) => {
      placemarks.push(
        `<Placemark><name>${kmlEscape(path.label)}</name><description>${kmlEscape([path.note, path.sourceFile].filter(Boolean).join(" · "))}</description><LineString><tessellate>1</tessellate><coordinates>${path.points.map((point) => `${point.lon},${point.lat},0`).join(" ")}</coordinates></LineString></Placemark>`
      );
    });
    const kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document><name>${kmlEscape(state.project.meta.title)} Google Timeline</name><description>Local-only Google Timeline export from Book Builder</description>${placemarks.join("")}</Document>\n</kml>`;
    downloadText(`google-timeline-${slugify(state.project.meta.title)}.kml`, kml, "application/vnd.google-earth.kml+xml");
  }

  function inferFamilyRelation(text) {
    const value = normalizeText(text);
    if (/(mother|father|mom|dad|brother|sister|sibling|son|daughter|grand|aunt|uncle|cousin|wife|husband|spouse|partner|family|niece|nephew|in-law|ancestor|parent|child)/.test(value)) return "family";
    if (/(mentor|teacher|coach|advisor|professor|sensei|rabbi|pastor)/.test(value)) return "mentor";
    if (/(roommate|housemate|tenant|landlord)/.test(value)) return "roommate";
    if (/(neighbor|neighbour)/.test(value)) return "neighbor";
    if (/(friend|buddy|pal)/.test(value)) return "friend";
    return "other";
  }

  function isSelfNodeName(name) {
    const value = normalizeText(name).replace(/[^a-z0-9]+/g, " ").trim();
    return [
      "self",
      "me",
      "myself",
      "steven",
      "steve",
      "steven greeran",
      "steven thomas greeran"
    ].includes(value);
  }

  function splitFamilyChain(line) {
    const parts = String(line || "").split(/\s*(?:->|=>|→|>|›)\s*/).map((part) => part.trim()).filter(Boolean);
    return parts.length > 1 ? parts : [String(line || "").trim()];
  }

  function parseFamilyToken(raw) {
    let line = String(raw || "").trim();
    const notes = [];
    let branch = "";
    let era = "";
    let edgeLabel = "";

    const relationLead = line.match(/^(mother|father|mom|dad|brother|sister|sibling|son|daughter|grandmother|grandfather|grandma|grandpa|aunt|uncle|cousin|wife|husband|spouse|partner|stepmother|stepfather|stepsister|stepbrother|niece|nephew|parent|child|ancestor)\s*[:=-]\s*(.+)$/i);
    if (relationLead) {
      notes.push(humanizeToken(relationLead[1]));
      edgeLabel = inferConnectionLabel(relationLead[1]);
      line = relationLead[2].trim();
    }

    const bracketMatch = line.match(/^(.+?)\s*[\[(]([^\])]+)[\])]\s*$/);
    if (bracketMatch) {
      line = bracketMatch[1].trim();
      notes.push(bracketMatch[2].trim());
      edgeLabel ||= inferConnectionLabel(bracketMatch[2]);
    }

    const separator = line.match(/^(.+?)\s+(?:\||—|–)\s+(.+)$/);
    if (separator) {
      line = separator[1].trim();
      notes.push(separator[2].trim());
      edgeLabel ||= inferConnectionLabel(separator[2]);
    }

    const csvish = line.split(/\s*,\s*/).map((part) => part.trim()).filter(Boolean);
    if (csvish.length > 1 && csvish[0].split(/\s+/).length <= 5) {
      line = csvish.shift();
      notes.push(csvish.join(" · "));
      edgeLabel ||= inferConnectionLabel(notes[notes.length - 1]);
    }

    const keywords = notes.join(" · ");
    const contexts = deriveLifeContextTags(`${line} ${keywords}`);
    if (contexts.length) {
      era = contexts.join(" · ");
    }
    if (/\b(branch|maternal|paternal|adopted|step|in-law)\b/i.test(keywords)) {
      branch = keywords;
    }

    return {
      name: line.trim(),
      relation: inferFamilyRelation(`${line} ${keywords}`),
      note: notes.join(" · ").trim(),
      branch,
      era,
      edgeLabel: edgeLabel || inferConnectionLabel(`${line} ${keywords}`)
    };
  }

  function looksLikeGedcom(text) {
    const sample = `\n${String(text || "")}`;
    return /\n0\s+HEAD\b/.test(sample)
      && /\n0\s+@[^@]+@\s+INDI\b/.test(sample)
      && /\n0\s+@[^@]+@\s+FAM\b/.test(sample);
  }

  function cleanGedcomValue(value) {
    return String(value || "")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizedGedcomName(value) {
    return cleanGedcomValue(value).replace(/\//g, " ").replace(/\s+/g, " ").trim();
  }

  function parseGedcomRecords(text) {
    const records = [];
    const stack = [];
    String(text || "").split(/\r?\n/).forEach((line) => {
      const match = line.match(/^(\d+)\s+(?:(@[^@]+@)\s+)?([A-Za-z0-9_]+)(?:\s+(.*))?$/);
      if (!match) return;
      const level = Number(match[1]);
      const node = {
        level,
        xref: match[2] || "",
        tag: match[3] || "",
        value: cleanGedcomValue(match[4] || ""),
        children: []
      };
      while (stack.length > level) stack.pop();
      if (!stack.length) {
        records.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }
      stack[level] = node;
      stack.length = level + 1;
    });
    return records;
  }

  function childNodes(node, tag) {
    return (node?.children || []).filter((child) => child.tag === tag);
  }

  function childValue(node, tag) {
    return childNodes(node, tag)[0]?.value || "";
  }

  function childValues(node, tag) {
    return childNodes(node, tag).map((child) => child.value).filter(Boolean);
  }

  function collectGedcomSourceIds(node, bucket = new Set()) {
    if (!node) return bucket;
    if (node.tag === "SOUR" && /^@[^@]+@$/.test(node.value || "")) bucket.add(node.value);
    (node.children || []).forEach((child) => collectGedcomSourceIds(child, bucket));
    return bucket;
  }

  function parseGedcomEvent(node) {
    return {
      date: childValue(node, "DATE"),
      place: childValue(node, "PLAC"),
      note: childValue(node, "NOTE"),
      sources: [...collectGedcomSourceIds(node)]
    };
  }

  function summarizeGedcomPerson(person, sourceTitles) {
    const bits = [];
    if (person.birth?.date || person.birth?.place) {
      bits.push(`Born ${[person.birth.date, person.birth.place].filter(Boolean).join(" · ")}`.trim());
    }
    if (person.death?.date || person.death?.place) {
      bits.push(`Died ${[person.death.date, person.death.place].filter(Boolean).join(" · ")}`.trim());
    }
    if (person.residences?.length) {
      const sample = person.residences.slice(0, 2).map((item) => [item.date, item.place].filter(Boolean).join(" · ")).filter(Boolean).join("; ");
      if (sample) bits.push(`Residence ${sample}`);
    }
    const sourceNames = [...(person.sourceIds || [])].map((id) => sourceTitles.get(id)).filter(Boolean).slice(0, 3);
    if (sourceNames.length) bits.push(`Sources ${sourceNames.join("; ")}`);
    if (person.notes?.length) bits.push(person.notes[0]);
    if (person.altNames?.length) bits.push(`Also ${person.altNames.slice(0, 2).join(" / ")}`);
    return bits.filter(Boolean).join(" · ");
  }

  function pushConnection(details, target, label) {
    if (!target) return;
    const item = {
      target: isSelfNodeName(target) ? "self" : String(target).trim(),
      label: normalizeConnectionLabel(label)
    };
    if (!item.target) return;
    if (details.some((entry) => normalizeText(entry.target) === normalizeText(item.target) && entry.label === item.label)) return;
    details.push(item);
  }

  function parseGedcomFamilyTree(text, options = {}) {
    const scope = options.scope === "direct" ? "direct" : "full";
    const records = parseGedcomRecords(text);
    const sourceTitles = new Map();
    const individuals = new Map();
    const families = new Map();

    records.forEach((record) => {
      if (record.tag === "SOUR" && record.xref) {
        sourceTitles.set(record.xref, childValue(record, "TITL") || record.value || record.xref);
        return;
      }
      if (record.tag === "INDI" && record.xref) {
        const person = {
          id: record.xref,
          name: "",
          altNames: [],
          sex: "",
          famc: [],
          fams: [],
          birth: null,
          death: null,
          burial: null,
          residences: [],
          notes: [],
          sourceIds: collectGedcomSourceIds(record)
        };
        childNodes(record, "NAME").forEach((node, index) => {
          const value = normalizedGedcomName(node.value);
          if (!value) return;
          if (!index && !person.name) person.name = value;
          else if (!person.altNames.includes(value)) person.altNames.push(value);
        });
        person.sex = childValue(record, "SEX");
        person.famc = childValues(record, "FAMC");
        person.fams = childValues(record, "FAMS");
        const birthNode = childNodes(record, "BIRT")[0];
        if (birthNode) person.birth = parseGedcomEvent(birthNode);
        const deathNode = childNodes(record, "DEAT")[0];
        if (deathNode) person.death = parseGedcomEvent(deathNode);
        const buriNode = childNodes(record, "BURI")[0];
        if (buriNode) person.burial = parseGedcomEvent(buriNode);
        childNodes(record, "RESI").forEach((node) => person.residences.push(parseGedcomEvent(node)));
        childNodes(record, "NOTE").forEach((node) => {
          const note = cleanGedcomValue(node.value || "");
          if (note) person.notes.push(note);
        });
        individuals.set(person.id, person);
        return;
      }
      if (record.tag === "FAM" && record.xref) {
        families.set(record.xref, {
          id: record.xref,
          husband: childValue(record, "HUSB"),
          wife: childValue(record, "WIFE"),
          children: childValues(record, "CHIL"),
          marriage: childNodes(record, "MARR")[0] ? parseGedcomEvent(childNodes(record, "MARR")[0]) : null
        });
      }
    });

    if (!individuals.size || !families.size) return [];

    const personName = (id) => individuals.get(id)?.name || "";
    const selfId = [...individuals.values()].find((person) => isSelfNodeName(person.name))?.id || [...individuals.keys()][0];
    if (!selfId) return [];

    const self = individuals.get(selfId);
    const selfFamilyAsChild = new Set(self?.famc || []);
    const selfFamilyAsSpouse = new Set(self?.fams || []);

    const relevantIds = new Set();
    if (scope === "direct") {
      relevantIds.add(selfId);
      [...selfFamilyAsChild, ...selfFamilyAsSpouse].forEach((familyId) => {
        const family = families.get(familyId);
        if (!family) return;
        [family.husband, family.wife, ...(family.children || [])].forEach((relativeId) => {
          if (relativeId) relevantIds.add(relativeId);
        });
      });
    } else {
      const queue = [selfId];
      while (queue.length) {
        const currentId = queue.shift();
        if (!currentId || relevantIds.has(currentId)) continue;
        relevantIds.add(currentId);
        const person = individuals.get(currentId);
        if (!person) continue;
        [...person.famc, ...person.fams].forEach((familyId) => {
          const family = families.get(familyId);
          if (!family) return;
          [family.husband, family.wife, ...(family.children || [])].forEach((relativeId) => {
            if (relativeId && !relevantIds.has(relativeId)) queue.push(relativeId);
          });
        });
      }
    }

    const parentFamilies = [...selfFamilyAsChild].map((familyId) => families.get(familyId)).filter(Boolean);
    const maternalRoots = new Set(parentFamilies.map((family) => family.wife).filter(Boolean));
    const paternalRoots = new Set(parentFamilies.map((family) => family.husband).filter(Boolean));
    const spouseRoots = new Set(
      [...selfFamilyAsSpouse]
        .map((familyId) => {
          const family = families.get(familyId);
          if (!family) return "";
          return family.husband === selfId ? family.wife : family.husband;
        })
        .filter(Boolean)
    );
    const childRoots = new Set(
      [...selfFamilyAsSpouse].flatMap((familyId) => families.get(familyId)?.children || []).filter(Boolean)
    );

    const adjacency = new Map();
    function connect(a, b) {
      if (!a || !b || !relevantIds.has(a) || !relevantIds.has(b)) return;
      if (!adjacency.has(a)) adjacency.set(a, new Set());
      if (!adjacency.has(b)) adjacency.set(b, new Set());
      adjacency.get(a).add(b);
      adjacency.get(b).add(a);
    }

    families.forEach((family) => {
      if (![family.husband, family.wife, ...(family.children || [])].some((id) => relevantIds.has(id))) return;
      if (family.husband && family.wife) connect(family.husband, family.wife);
      (family.children || []).forEach((childId) => {
        if (family.husband) connect(childId, family.husband);
        if (family.wife) connect(childId, family.wife);
      });
      for (let i = 0; i < (family.children || []).length; i += 1) {
        for (let j = i + 1; j < (family.children || []).length; j += 1) connect(family.children[i], family.children[j]);
      }
    });

    const distance = new Map([[selfId, 0]]);
    const search = [selfId];
    while (search.length) {
      const current = search.shift();
      const nextDistance = (distance.get(current) || 0) + 1;
      (adjacency.get(current) || []).forEach((neighbor) => {
        if (!relevantIds.has(neighbor) || distance.has(neighbor)) return;
        distance.set(neighbor, nextDistance);
        search.push(neighbor);
      });
    }

    function walkBranch(rootIds, blockedIds = new Set()) {
      const seen = new Set();
      const queue = rootIds.filter((id) => id && relevantIds.has(id) && !blockedIds.has(id));
      while (queue.length) {
        const current = queue.shift();
        if (!current || seen.has(current) || blockedIds.has(current)) continue;
        seen.add(current);
        (adjacency.get(current) || []).forEach((neighbor) => {
          if (!seen.has(neighbor) && !blockedIds.has(neighbor)) queue.push(neighbor);
        });
      }
      return seen;
    }

    const maternalReach = walkBranch([...maternalRoots], new Set([selfId, ...paternalRoots]));
    const paternalReach = walkBranch([...paternalRoots], new Set([selfId, ...maternalRoots]));
    const partnerReach = walkBranch([...spouseRoots], new Set([selfId]));
    const descendantReach = walkBranch([...childRoots], new Set([selfId]));

    function relationFromSelfPerspective(person) {
      if (!person || person.id === selfId) return "";
      if (person.fams.some((familyId) => selfFamilyAsChild.has(familyId))) return "parent";
      if (person.famc.some((familyId) => selfFamilyAsSpouse.has(familyId))) return "child";
      if (person.fams.some((familyId) => selfFamilyAsSpouse.has(familyId))) return "spouse";
      if (person.famc.some((familyId) => selfFamilyAsChild.has(familyId))) return "sibling";
      return "";
    }

    function directRelationToSelf(person) {
      if (!person || person.id === selfId) return "";
      const relation = relationFromSelfPerspective(person);
      return ({ parent: "child", child: "parent", spouse: "spouse", sibling: "sibling" })[relation] || "";
    }

    function roleLabelToSelf(person) {
      const relation = relationFromSelfPerspective(person);
      return ({ parent: "Parent of self", child: "Child of self", spouse: "Spouse of self", sibling: "Sibling of self" })[relation] || "";
    }

    function branchLabelForPerson(person) {
      if (!person || person.id === selfId) return "";
      const relation = relationFromSelfPerspective(person);
      if (relation === "parent") {
        if (maternalRoots.has(person.id) && !paternalRoots.has(person.id)) return "Maternal branch";
        if (paternalRoots.has(person.id) && !maternalRoots.has(person.id)) return "Paternal branch";
        return "Immediate family";
      }
      if (relation === "sibling") return "Immediate family";
      if (relation === "spouse") return "Partner branch";
      if (relation === "child") return "Descendant branch";
      const maternal = maternalReach.has(person.id);
      const paternal = paternalReach.has(person.id);
      const partner = partnerReach.has(person.id);
      const descendant = descendantReach.has(person.id);
      if (maternal && !paternal) return "Maternal branch";
      if (paternal && !maternal) return "Paternal branch";
      if (descendant && !partner) return "Descendant branch";
      if (partner && !descendant) return "Partner branch";
      if (descendant && partner) return "Descendant / partner branch";
      if (maternal && paternal) return "Shared family branch";
      return "Extended family";
    }

    function pushRelativeConnection(details, targetId, label) {
      if (!targetId || !relevantIds.has(targetId)) return;
      pushConnection(details, personName(targetId), label);
    }

    return [...relevantIds]
      .filter((id) => id !== selfId)
      .map((id, index) => {
        const person = individuals.get(id);
        const details = [];
        person.famc.forEach((familyId) => {
          const family = families.get(familyId);
          if (!family) return;
          pushRelativeConnection(details, family.husband, "parent");
          pushRelativeConnection(details, family.wife, "parent");
          (family.children || []).forEach((childId) => {
            if (childId !== person.id) pushRelativeConnection(details, childId, "sibling");
          });
        });
        person.fams.forEach((familyId) => {
          const family = families.get(familyId);
          if (!family) return;
          const spouseId = family.husband === person.id ? family.wife : family.husband;
          pushRelativeConnection(details, spouseId, "spouse");
          (family.children || []).forEach((childId) => pushRelativeConnection(details, childId, "child"));
        });
        const direct = directRelationToSelf(person);
        const selfRole = roleLabelToSelf(person);
        const branchLabel = branchLabelForPerson(person);
        if (direct) pushConnection(details, "self", direct);
        const contextText = [
          person.birth?.place,
          person.death?.place,
          person.burial?.place,
          ...(person.residences || []).map((item) => item.place),
          ...(person.notes || [])
        ].filter(Boolean).join(" · ");
        const contextTags = deriveLifeContextTags(contextText);
        const primarySource = [...(person.sourceIds || [])].map((sourceId) => sourceTitles.get(sourceId)).filter(Boolean)[0] || "GEDCOM / Ancestry import";
        return {
          id: `cast-ged-${index + 1}`,
          name: person.name || `Person ${index + 1}`,
          relation: "family",
          era: contextTags.join(" · "),
          branch: [
            "GEDCOM / Ancestry import",
            scope === "direct" ? "Direct relatives only" : "Full connected tree",
            selfRole,
            branchLabel
          ].filter(Boolean).join(" · "),
          generation: Number.isFinite(distance.get(id)) ? distance.get(id) : null,
          linkDetails: details.length ? details : [{ target: "self", label: "family" }],
          links: details.length ? details.map((item) => item.target) : ["self"],
          note: summarizeGedcomPerson(person, sourceTitles) || primarySource
        };
      });
  }

  function parseFamilyTreeText(text) {
    const sourceLines = String(text || "")
      .split(/\r?\n/)
      .map((line) => line.replace(/\t/g, "    "))
      .filter((line) => line.trim());
    const expanded = [];
    sourceLines.forEach((rawLine) => {
      const indent = (rawLine.match(/^\s*/) || [""])[0].length;
      const baseLevel = Math.floor(indent / 2);
      const clean = rawLine.trim().replace(/^[-*•]+\s*/, "").replace(/^\d+[.)]\s*/, "").trim();
      if (!clean) return;
      splitFamilyChain(clean).forEach((token, offset) => {
        expanded.push({ level: baseLevel + offset, token });
      });
    });

    const entries = [];
    const stack = [];
    expanded.forEach(({ level, token }) => {
      const parsed = parseFamilyToken(token);
      if (!parsed.name) return;
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      const parent = stack[stack.length - 1];
      if (isSelfNodeName(parsed.name)) {
        stack.push({ level, name: "self", edgeLabel: "self" });
        return;
      }
      const relation = parsed.relation === "other" && (parent || level > 0) ? "family" : parsed.relation;
      const inheritedEdgeLabel = parsed.edgeLabel || ((parent && ["parent", "child"].includes(parent.edgeLabel)) ? parent.edgeLabel : "");
      const linkDetails = [{
        target: parent ? parent.name : "self",
        label: inheritedEdgeLabel || (relation === "family" ? "family" : "")
      }];
      const entry = {
        id: `cast-${Date.now().toString(36)}-${entries.length + 1}`,
        name: parsed.name,
        relation,
        era: parsed.era || "",
        branch: parsed.branch || (parent ? `Imported family tree · level ${level}` : "Imported family tree"),
        generation: level,
        linkDetails,
        links: linkDetails.map((item) => item.target),
        note: parsed.note || `Imported from family tree text · level ${level}`
      };
      entries.push(entry);
      stack.push({ level, name: parsed.name, edgeLabel: inheritedEdgeLabel });
    });
    return entries;
  }

  async function importCastTreeTextFile(file, options = {}) {
    const text = await readFileAsText(file);
    const parsed = looksLikeGedcom(text) ? parseGedcomFamilyTree(text, options) : parseFamilyTreeText(text);
    if (!parsed.length) throw new Error("No usable family-tree lines were found.");
    return parsed;
  }

  function inferChapterPlaceIds(chapter) {
    if (!chapter) return [];
    const haystack = normalizeText([chapter.title, chapter.prompt, chapter.body].join(" "));
    return allPlaces()
      .filter((place) => placeAliases(place).some((alias) => alias && haystack.includes(alias)))
      .map((place) => place.id);
  }

  function chapterPlaceIds(chapter) {
    const manual = ensureChapterPlaceIds(chapter);
    if (manual.length) return [...manual];
    return inferChapterPlaceIds(chapter);
  }

  function focusChapterOnMap(index) {
    state.selectedChapterIndex = index;
    state.mapFilter = "all";
    state.selectedGooglePathId = "";
    const placeIds = chapterPlaceIds(state.project.chapters[index]);
    if (placeIds.length) state.selectedPlaceId = placeIds[0];
    activateStagePanel("map");
    renderResearchMap();
  }

  function renderStats() {
    $("statTemplate").textContent = currentTemplate().label;
    $("statChapters").textContent = String(state.project.chapters.length);
    $("statWords").textContent = String(projectWordCount(state.project));
    $("statSnapshots").textContent = String(state.snapshots.length);
  }

  function renderSnapshots() {
    const host = $("snapshotList");
    host.replaceChildren();
    if (!state.snapshots.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No snapshots yet. Save one before a major rewrite.";
      host.append(empty);
      return;
    }
    state.snapshots.forEach((snapshot) => {
      const card = document.createElement("article");
      card.className = "snapshot-item";
      const b = document.createElement("b");
      b.textContent = snapshot.title;
      const small = document.createElement("small");
      small.textContent = `${snapshot.when} · ${snapshot.template} · ${snapshot.chapterCount} chapters`;
      const actions = document.createElement("div");
      actions.className = "snapshot-actions";

      const restore = document.createElement("button");
      restore.type = "button";
      restore.textContent = "Restore";
      restore.addEventListener("click", () => {
        if (!window.confirm(`Restore snapshot “${snapshot.title}”?`)) return;
          state.project = ensureProjectShape(deepClone(snapshot.project));
          saveProject();
          renderEverything();
      });

      const download = document.createElement("button");
      download.type = "button";
      download.textContent = "Export";
      download.addEventListener("click", () => {
        downloadText(`${slugify(snapshot.title)}.json`, JSON.stringify(snapshot.project, null, 2), "application/json");
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        state.snapshots = state.snapshots.filter((item) => item.id !== snapshot.id);
        saveSnapshots();
        renderStats();
        renderSnapshots();
      });

      actions.append(restore, download, remove);
      card.append(b, small, actions);
      host.append(card);
    });
  }

  function laneColor(lane) {
    if (lane === "official") return "#f2c984";
    if (lane === "self-published") return "#8ce8dc";
    if (lane === "private") return "#ff8c9d";
    if (lane === "google") return "#7db7ff";
    return "#c7d4ef";
  }

  function filteredPlaces() {
    return allPlaces().filter((place) => {
      if (state.mapFilter === "official") return place.lane === "official";
      if (state.mapFilter === "self-published") return place.lane === "self-published";
      if (state.mapFilter === "private") return place.lane === "private";
      return true;
    });
  }

  function renderChapterLinkList() {
    const host = $("chapterLinkList");
    if (!host) return;
    host.replaceChildren();
    state.project.chapters.forEach((chapter, index) => {
      const linked = chapterPlaceIds(chapter);
      const button = document.createElement("button");
      button.type = "button";
      button.classList.toggle("active", state.selectedChapterIndex === index);
      const b = document.createElement("b");
      b.textContent = `${String(index + 1).padStart(2, "0")} · ${chapter.title}`;
      const small = document.createElement("small");
      small.textContent = linked.length
        ? `${chapter.evidence} · ${linked.length} linked place${linked.length === 1 ? "" : "s"}`
        : `${chapter.evidence} · no linked places detected`;
      button.append(b, small);
      button.addEventListener("click", () => focusChapterOnMap(index));
      host.append(button);
    });
  }

  function renderTimelineLane() {
    const host = $("timelineLane");
    if (!host) return;
    const items = [
      {
        id: "pasadena-private",
        label: "1982 · Pasadena origin marker",
        lane: "private",
        note: "Private-lane birth/origin note supplied in chat; kept local-only unless intentionally published."
      },
      {
        id: "glendora",
        label: "1997–2001 · Glendora High School era",
        lane: "self-published",
        note: "School-era anchor from the self-published resume. [9]"
      },
      {
        id: "pomona",
        label: "1998 · Cal Poly Pomona summer study",
        lane: "self-published",
        note: "Pomona-area summer-school anchor from the self-published resume. [9]"
      },
      {
        id: "santa-barbara",
        label: "2001–2004 · UCSB / Santa Barbara years",
        lane: "self-published",
        note: "UCSB and Santa Barbara-area work/volunteer references, plus UCSB Cylinder Audio Archive programming/interface credit. [9][12]"
      },
      {
        id: "goleta",
        label: "2000s · Goleta reference",
        lane: "self-published",
        note: "Rat Races / Santa Barbara Renaissance Pleasure Faire / Live Oak Camp / Goleta appear on the self-published resume; the venue itself is publicly documented. [9][13]"
      },
      {
        id: "wrightwood",
        label: "Later online profiles · Wrightwood",
        lane: "self-published",
        note: "Keybase and Mixcloud profiles identify Wrightwood. [10][11]"
      },
      {
        id: "independence-private",
        label: "Research lead · Independence, Missouri",
        lane: "private",
        note: "Science Mountain / science.edu lead remains local-only until documented."
      },
      {
        id: "st-croix",
        label: "2022 · St. Croix registration",
        lane: "official",
        note: "Initial USVI registration date reported by VIDOJ. [1]"
      },
      {
        id: "frederiksted",
        label: "2025 · Frederiksted detention",
        lane: "official",
        note: "Detention near Midre Cummings Park reported in official/public sources. [2][7][8]"
      }
    ];
    const privateMilestoneItems = (state.privateMilestones || []).map((entry) => timelineEntryForPrivateMilestone(entry));
    const glendoraIndex = items.findIndex((item) => item.id === "glendora");
    if (privateMilestoneItems.length) items.splice(glendoraIndex >= 0 ? glendoraIndex + 1 : items.length, 0, ...privateMilestoneItems);
    host.replaceChildren();
    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = `timeline-item ${item.lane === "self-published" ? "resume" : item.lane}`;
      card.classList.toggle("active", item.id === state.selectedPlaceId || (!!item.placeId && item.placeId === state.selectedPlaceId));
      const b = document.createElement("b");
      b.style.color = laneColor(item.lane);
      b.textContent = item.label;
      const small = document.createElement("small");
      small.textContent = item.note;
      card.append(b, small);
      card.addEventListener("click", () => {
        state.selectedPlaceId = item.placeId || item.id;
        state.selectedGooglePathId = "";
        renderResearchMap();
      });
      host.append(card);
    });
  }

  function renderGoogleTimeline() {
    const meta = $("googleTimelineMeta");
    const list = $("googleTimelineList");
    if (!meta || !list) return;
    meta.replaceChildren();
    list.replaceChildren();
    const data = state.googleTimeline || emptyGoogleTimeline();
    const hasImport = data.places.length || data.events.length || data.paths.length;
    if (!hasImport) {
      const note = document.createElement("p");
      note.textContent = "No Google Timeline import yet. Use exported location-history.json or Takeout-style JSON files. Imported data stays local-only.";
      meta.append(note);
      return;
    }

    const summary = document.createElement("p");
    summary.textContent = `Imported ${data.files.length} file${data.files.length === 1 ? "" : "s"}${data.importedAt ? ` on ${shortDateTime(data.importedAt)}` : ""}.`;
    const chips = document.createElement("div");
    chips.className = "google-timeline-chips";
    [
      `${data.stats.rawPlaceCount || data.places.length} places found`,
      `${data.stats.rawEventCount || data.events.length} events found`,
      `${data.stats.rawRouteCount || data.paths.length} routes found`,
      `${data.stats.visits || 0} visits`,
      `${data.stats.activities || 0} activities`,
      `${data.stats.pathPointCount || 0} path points kept`
    ].forEach((label) => {
      const chip = document.createElement("span");
      chip.textContent = label;
      chips.append(chip);
    });
    meta.append(summary, chips);

    const fileNote = document.createElement("small");
    fileNote.textContent = `Files: ${data.files.join(", ")}${data.stats.formats?.length ? ` · formats: ${data.stats.formats.join(", ")}` : ""}${(data.stats.rawPlaceCount || 0) > data.places.length || (data.stats.rawEventCount || 0) > data.events.length || (data.stats.rawRouteCount || 0) > data.paths.length ? ` · showing trimmed local subset for browser storage` : ""}`;
    meta.append(fileNote);

    data.events.forEach((event) => {
      const card = document.createElement("div");
      card.className = "timeline-item private google";
      if (event.placeId || event.routeId) card.classList.add("interactive");
      card.classList.toggle("active", (!!event.placeId && event.placeId === state.selectedPlaceId) || (!!event.routeId && event.routeId === state.selectedGooglePathId));
      const b = document.createElement("b");
      b.style.color = "#7db7ff";
      b.textContent = event.label;
      const small = document.createElement("small");
      small.textContent = [
        event.note,
        event.startTime && event.endTime ? `${shortDateTime(event.startTime)} → ${shortDateTime(event.endTime)}` : shortDateTime(event.startTime || event.endTime),
        event.placeId ? "click to focus imported place" : event.routeId ? "click to highlight imported route" : ""
      ].filter(Boolean).join(" · ");
      card.append(b, small);
      if (event.placeId || event.routeId) {
        card.addEventListener("click", () => {
          state.selectedGooglePathId = event.routeId || "";
          state.selectedPlaceId = event.placeId || "";
          renderResearchMap();
        });
      }
      list.append(card);
    });
  }

  function renderManualPins() {
    const host = $("manualPinList");
    if (!host) return;
    host.replaceChildren();
    if (!state.localPins.length) {
      const empty = document.createElement("small");
      empty.textContent = "No manual pins yet. Added pins stay local-only and never enter exports unless you write them into chapters yourself.";
      host.append(empty);
      return;
    }
    state.localPins.forEach((pin) => {
      const item = document.createElement("article");
      item.className = "manual-pin-item";
      item.classList.toggle("active", state.selectedPlaceId === pin.id);
      const b = document.createElement("b");
      b.textContent = pin.name;
      b.style.color = laneColor(pin.lane);
      const small = document.createElement("small");
      small.textContent = pin.summary;
      const meta = document.createElement("div");
      meta.className = "manual-pin-meta";
      meta.innerHTML = `<span>${pin.lane}</span><span>${pin.lat.toFixed(4)}, ${pin.lon.toFixed(4)}</span><span>local only</span>`;
      const actions = document.createElement("div");
      actions.className = "snapshot-actions";
      const focus = document.createElement("button");
      focus.type = "button";
      focus.textContent = "Focus";
      focus.addEventListener("click", () => {
        state.selectedPlaceId = pin.id;
        state.selectedGooglePathId = "";
        renderResearchMap();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        state.localPins = state.localPins.filter((item) => item.id !== pin.id);
        saveManualPins();
        state.project.chapters.forEach((chapter) => {
          chapter.placeIds = ensureChapterPlaceIds(chapter).filter((id) => id !== pin.id);
        });
        if (state.selectedPlaceId === pin.id) state.selectedPlaceId = "";
        renderResearchMap();
        renderChapterList();
      });
      actions.append(focus, remove);
      item.append(b, small, meta, actions);
      host.append(item);
    });
  }

  function timelineEntryForPrivateMilestone(entry) {
    const matchedPlace = findPlaceByAlias(entry.place);
    return {
      id: entry.id,
      placeId: matchedPlace?.id || "",
      label: [entry.era || "School-era memory", entry.title, entry.people].filter(Boolean).join(" · "),
      lane: "private",
      note: [
        entry.place || matchedPlace?.name || "",
        (entry.linkedCastNames || []).length ? `cast ${entry.linkedCastNames.join(", ")}` : "",
        entry.photoDataUrl ? "photo attached" : "",
        entry.note
      ].filter(Boolean).join(" · ")
    };
  }

  function renderArtifactLane() {
    const host = $("artifactLaneList");
    if (!host) return;
    host.replaceChildren();
    if (!state.artifactLane.length) {
      const empty = document.createElement("small");
      empty.textContent = "No local-only object notes yet. Add vehicles, markings, props, or found objects here.";
      host.append(empty);
      return;
    }
    state.artifactLane.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "artifact-card";
      const title = document.createElement("b");
      title.textContent = entry.title;
      title.style.color = entry.kind === "vehicle" ? "#9facff" : entry.kind === "symbol" ? "#f2c984" : "#8ce8dc";
      const meta = document.createElement("small");
      meta.textContent = entry.note || "Local-only object note.";
      const tags = document.createElement("div");
      tags.className = "artifact-tags";
      [humanizeToken(entry.kind), entry.era, entry.place, entry.marking].filter(Boolean).forEach((value) => {
        const chip = document.createElement("span");
        chip.textContent = value;
        tags.append(chip);
      });
      const actions = document.createElement("div");
      actions.className = "cast-actions";
      const noteBtn = document.createElement("button");
      noteBtn.type = "button";
      noteBtn.textContent = "To scratchpad";
      noteBtn.addEventListener("click", () => {
        const line = [entry.place ? `${entry.place} ::` : "", entry.title, entry.marking, entry.note].filter(Boolean).join(" ").trim();
        state.privateMemo.privateLeads = `${state.privateMemo.privateLeads ? state.privateMemo.privateLeads + "\n" : ""}${line}`;
        savePrivateMemo();
        syncPrivatePads();
        renderPrivateStoryClusters();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        state.artifactLane = state.artifactLane.filter((item) => item.id !== entry.id);
        saveArtifactLane();
        renderArtifactLane();
        renderPrivateStoryClusters();
      });
      actions.append(noteBtn, remove);
      card.append(title, tags, meta, actions);
      host.append(card);
    });
  }

  function renderPrivateMilestoneLane() {
    const host = $("privateMilestoneList");
    if (!host) return;
    host.replaceChildren();
    if (!state.privateMilestones.length) {
      const empty = document.createElement("small");
      empty.textContent = "No local-only school or life-event cards yet. Add graduations, dances, ceremonies, or memory anchors here.";
      host.append(empty);
      return;
    }

    const order = ["wedding-ceremony", "school-dance-reunion", "other"];
    const labels = {
      "wedding-ceremony": "1. Weddings / ceremonies",
      "school-dance-reunion": "2. School dances / reunions",
      other: "3. Other local-only memory anchors"
    };

    order.forEach((groupKey) => {
      const items = state.privateMilestones.filter((entry) => milestoneCategory(entry.category, entry) === groupKey);
      if (!items.length) return;

      const section = document.createElement("section");
      section.className = "private-milestone-group";
      const heading = document.createElement("h4");
      heading.textContent = labels[groupKey];
      heading.style.color = milestoneCategoryColor(groupKey);
      section.append(heading);

      items.forEach((entry) => {
        entry.category = milestoneCategory(entry.category, entry);
        const card = document.createElement("article");
        card.className = "private-milestone-card";
        const title = document.createElement("b");
        title.textContent = entry.title;
        title.style.color = milestoneCategoryColor(entry.category);

        const thumb = document.createElement("div");
        thumb.className = "photo-thumb private-milestone-photo";
        if (entry.photoDataUrl) {
          const img = document.createElement("img");
          img.src = entry.photoDataUrl;
          img.alt = `${entry.title} local-only photo`;
          thumb.append(img);
        } else {
          const empty = document.createElement("div");
          empty.className = "photo-empty";
          empty.textContent = "No milestone photo yet";
          thumb.append(empty);
        }

        const tags = document.createElement("div");
        tags.className = "artifact-tags";
        [milestoneCategoryLabel(entry.category), entry.era, entry.place, entry.people, entry.photoDataUrl ? "photo attached" : ""].filter(Boolean).forEach((value) => {
          const chip = document.createElement("span");
          chip.textContent = value;
          tags.append(chip);
        });

        if ((entry.linkedCastNames || []).length) {
          const links = document.createElement("div");
          links.className = "private-milestone-links";
          entry.linkedCastNames.forEach((name) => {
            const match = findCastEntryByName(name);
            const chip = document.createElement(match ? "button" : "span");
            chip.className = `private-link-chip${match ? "" : " unmatched"}`;
            chip.textContent = match ? `Cast: ${name}` : `Cast pending: ${name}`;
            if (match) {
              chip.type = "button";
              chip.addEventListener("click", () => {
                state.selectedCastId = match.id;
                renderCastTree();
              });
            }
            links.append(chip);
          });
          card.append(title, thumb, tags, links);
        } else {
          card.append(title, thumb, tags);
        }

        const note = document.createElement("small");
        note.textContent = entry.note || "Local-only milestone note.";
        const actions = document.createElement("div");
        actions.className = "cast-actions";

        const upload = document.createElement("button");
        upload.type = "button";
        upload.textContent = entry.photoDataUrl ? "Replace photo" : "Upload photo";
        upload.addEventListener("click", () => {
          state.pendingMilestonePhotoId = entry.id;
          $("privateMilestonePhotoInput")?.click();
        });

        const clearPhoto = document.createElement("button");
        clearPhoto.type = "button";
        clearPhoto.textContent = "Clear photo";
        clearPhoto.addEventListener("click", () => {
          if (!entry.photoDataUrl) return;
          entry.photoDataUrl = "";
          savePrivateMilestones();
          renderPrivateMilestoneLane();
          renderPrivateStoryClusters();
          renderResearchMap();
        });

        const focus = document.createElement("button");
        focus.type = "button";
        focus.textContent = "To timeline";
        focus.addEventListener("click", () => {
          state.selectedPlaceId = findPlaceByAlias(entry.place)?.id || state.selectedPlaceId || "";
          state.selectedGooglePathId = "";
          renderResearchMap();
        });

        const scratch = document.createElement("button");
        scratch.type = "button";
        scratch.textContent = "To scratchpad";
        scratch.addEventListener("click", () => {
          const line = [
            entry.place ? `${entry.place} ::` : "",
            milestoneCategoryLabel(entry.category),
            entry.era,
            entry.title,
            entry.people ? `with ${entry.people}` : "",
            (entry.linkedCastNames || []).length ? `cast ${entry.linkedCastNames.join(", ")}` : "",
            entry.note
          ].filter(Boolean).join(" ").trim();
          state.privateMemo.privateLeads = `${state.privateMemo.privateLeads ? state.privateMemo.privateLeads + "\n" : ""}${line}`;
          savePrivateMemo();
          syncPrivatePads();
          renderPrivateStoryClusters();
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Delete";
        remove.addEventListener("click", () => {
          state.privateMilestones = state.privateMilestones.filter((item) => item.id !== entry.id);
          savePrivateMilestones();
          renderPrivateMilestoneLane();
          renderPrivateStoryClusters();
          renderResearchMap();
        });

        actions.append(upload, clearPhoto, focus, scratch, remove);
        card.append(note, actions);
        section.append(card);
      });

      host.append(section);
    });
  }

  function renderPhotoSlots() {
    const host = $("photoGrid");
    if (!host) return;
    host.replaceChildren();
    state.photoSlots.forEach((slot) => {
      const card = document.createElement("article");
      card.className = "photo-card";
      const thumb = document.createElement("div");
      thumb.className = "photo-thumb";
      if (slot.dataUrl) {
        const img = document.createElement("img");
        img.src = slot.dataUrl;
        img.alt = slot.title || "Local-only scrapbook image";
        thumb.append(img);
      } else {
        const empty = document.createElement("div");
        empty.className = "photo-empty";
        empty.textContent = "No image yet";
        thumb.append(empty);
      }
      const meta = document.createElement("div");
      meta.className = "photo-meta";
      const title = document.createElement("input");
      title.type = "text";
      title.value = slot.title;
      title.placeholder = "Slot title";
      title.addEventListener("input", () => {
        slot.title = title.value;
        savePhotoSlots();
      });
      const caption = document.createElement("textarea");
      caption.rows = 3;
      caption.value = slot.caption;
      caption.placeholder = "Caption / local-only note";
      caption.addEventListener("input", () => {
        slot.caption = caption.value;
        savePhotoSlots();
      });
      meta.append(title, caption);
      const actions = document.createElement("div");
      actions.className = "photo-actions";
      const upload = document.createElement("button");
      upload.type = "button";
      upload.textContent = slot.dataUrl ? "Replace" : "Upload";
      upload.addEventListener("click", () => {
        state.pendingPhotoSlotId = slot.id;
        $("photoInput")?.click();
      });
      const clear = document.createElement("button");
      clear.type = "button";
      clear.textContent = "Clear";
      clear.addEventListener("click", () => {
        slot.dataUrl = "";
        slot.caption = "";
        savePhotoSlots();
        renderPhotoSlots();
      });
      actions.append(upload, clear);
      card.append(thumb, meta, actions);
      host.append(card);
    });
  }

  function relationColor(relation) {
    return ({
      family: "#f2c984",
      friend: "#8ce8dc",
      mentor: "#c7a9ff",
      roommate: "#9facff",
      neighbor: "#ffb4c4",
      other: "#c7d4ef"
    })[relation] || "#c7d4ef";
  }

  function dnaSideTone(value) {
    return ["maternal", "paternal", "both", "unknown"].includes(normalizeText(value)) ? normalizeText(value) : "unknown";
  }

  function dnaSideColor(value) {
    return ({
      maternal: "#ff8fab",
      paternal: "#7db5ff",
      both: "#b996ff",
      unknown: "#9aa7be"
    })[dnaSideTone(value)] || "#9aa7be";
  }

  function applyDnaSideAccent(element, side) {
    if (!element) return;
    const tone = dnaSideTone(side);
    if (tone === "unknown") {
      element.style.borderColor = dnaSideColor(tone);
      element.style.boxShadow = `0 0 0 1px ${dnaSideColor(tone)}22 inset`;
      element.style.background = "rgba(255,255,255,0.04)";
      return;
    }
    if (tone === "both") {
      element.style.borderColor = dnaSideColor(tone);
      element.style.boxShadow = `0 0 0 1px ${dnaSideColor(tone)}22 inset`;
      element.style.background = "linear-gradient(90deg, rgba(255,143,171,0.12), rgba(125,181,255,0.12))";
      return;
    }
    const color = dnaSideColor(tone);
    element.style.borderColor = color;
    element.style.boxShadow = `0 0 0 1px ${color}22 inset`;
    element.style.background = `linear-gradient(180deg, ${color}10, rgba(255,255,255,0.04) 45%)`;
  }

  function formatDnaPercent(value) {
    return Number.isFinite(Number(value)) ? `${Number(value)}% shared` : "";
  }

  function formatDnaCm(value) {
    return Number.isFinite(Number(value)) ? `${Number(value)} cM` : "";
  }

  function renderDnaMatchHelper() {
    const host = $("dnaMatchList");
    if (!host) return;
    host.replaceChildren();
    if (!state.dnaMatches.length) {
      const empty = document.createElement("small");
      empty.textContent = "No local-only DNA matches yet. Add a name, side flag, optional shared %, optional cM, and any working note.";
      host.append(empty);
      return;
    }
    state.dnaMatches.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "dna-match-card";
      applyDnaSideAccent(card, entry.side);
      const title = document.createElement("b");
      title.textContent = entry.name;
      title.style.color = dnaSideColor(entry.side);
      const tags = document.createElement("div");
      tags.className = "artifact-tags";
      [humanizeToken(entry.side), formatDnaPercent(entry.sharedPercent), formatDnaCm(entry.sharedCm), entry.relationGuess, entry.linkedPerson].filter(Boolean).forEach((value) => {
        const chip = document.createElement("span");
        chip.textContent = value;
        tags.append(chip);
      });
      const note = document.createElement("small");
      note.textContent = entry.note || "Autosomal overlap reminder: treat percent/cM as a clue, not proof by itself.";
      const actions = document.createElement("div");
      actions.className = "cast-actions";
      const scratch = document.createElement("button");
      scratch.type = "button";
      scratch.textContent = "To scratchpad";
      scratch.addEventListener("click", () => {
        const line = [
          "DNA match ::",
          entry.name,
          humanizeToken(entry.side),
          formatDnaPercent(entry.sharedPercent),
          formatDnaCm(entry.sharedCm),
          entry.relationGuess,
          entry.linkedPerson ? `linked to ${entry.linkedPerson}` : "",
          entry.note
        ].filter(Boolean).join(" · ");
        state.privateMemo.privateLeads = `${state.privateMemo.privateLeads ? state.privateMemo.privateLeads + "\n" : ""}${line}`;
        savePrivateMemo();
        syncPrivatePads();
        renderPrivateStoryClusters();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        state.dnaMatches = state.dnaMatches.filter((item) => item.id !== entry.id);
        saveDnaMatches();
        renderDnaMatchHelper();
      });
      actions.append(scratch, remove);
      card.append(title, tags, note, actions);
      host.append(card);
    });
  }

  function branchTone(value) {
    const text = normalizeText(value);
    if (text.includes("maternal")) return "maternal";
    if (text.includes("paternal")) return "paternal";
    if (text.includes("partner")) return "partner";
    if (text.includes("descendant")) return "descendant";
    if (text.includes("immediate")) return "immediate";
    if (text.includes("shared family")) return "shared";
    return "";
  }

  function branchColor(value) {
    return ({
      maternal: "#ff8fab",
      paternal: "#7db5ff",
      partner: "#c7a9ff",
      descendant: "#78e3b5",
      immediate: "#f2c984",
      shared: "#e7e38b"
    })[branchTone(value)] || "#c7d4ef";
  }

  function applyBranchAccent(element, branch) {
    if (!element) return;
    const tone = branchTone(branch);
    if (!tone) {
      element.style.borderColor = "";
      element.style.boxShadow = "";
      element.style.background = "";
      return;
    }
    const color = branchColor(branch);
    element.style.borderColor = color;
    element.style.boxShadow = `0 0 0 1px ${color}33 inset`;
    element.style.background = `linear-gradient(180deg, ${color}10, rgba(255,255,255,0.04) 45%)`;
  }

  function canonicalStoryPlaceLabel(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const needle = normalizeText(raw);
    const matched = allPlaces().find((place) => placeAliases(place).some((alias) => alias === needle));
    return matched ? matched.name : raw;
  }

  function explicitStoryPlace(line) {
    const match = String(line || "").trim().match(/^([^:]+?)\s*(?:::{1,2}|—|–|--)\s*(.+)$/);
    if (!match) return null;
    return {
      place: canonicalStoryPlaceLabel(match[1]),
      detail: match[2].trim()
    };
  }

  function detectStoryPlace(detail) {
    const explicit = explicitStoryPlace(detail);
    if (explicit) return explicit;
    const text = normalizeText(detail);
    const found = allPlaces().find((place) => placeAliases(place).some((alias) => alias && text.includes(alias)));
    if (found) return { place: found.name, detail: String(detail || "").trim() };
    return null;
  }

  function privateStoryEntries() {
    const entries = [];
    String(state.privateMemo.privateLeads || "")
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*•]+\s*/, "").trim())
      .filter(Boolean)
      .forEach((line) => {
        const found = detectStoryPlace(line);
        if (!found) return;
        entries.push({
          place: found.place,
          detail: found.detail,
          source: "scratchpad"
        });
      });
    (state.artifactLane || []).forEach((entry) => {
      const summary = [entry.marking, entry.note].filter(Boolean).join(" · ");
      const place = canonicalStoryPlaceLabel(entry.place) || "Unsorted object notes";
      entries.push({
        place,
        detail: [entry.title, summary].filter(Boolean).join(" · "),
        source: humanizeToken(entry.kind || "object")
      });
    });
    (state.privateMilestones || []).forEach((entry) => {
      const place = canonicalStoryPlaceLabel(entry.place);
      if (!place) return;
      entries.push({
        place,
        detail: [entry.era, entry.title, entry.people ? `with ${entry.people}` : "", entry.note].filter(Boolean).join(" · "),
        source: "milestone"
      });
    });
    return entries;
  }

  function renderPrivateStoryClusters() {
    const host = $("privateStoryClusterList");
    if (!host) return;
    host.replaceChildren();
    const groups = new Map();
    privateStoryEntries().forEach((entry) => {
      if (!entry.place || !entry.detail) return;
      if (!groups.has(entry.place)) groups.set(entry.place, []);
      groups.get(entry.place).push(entry);
    });
    if (!groups.size) {
      const empty = document.createElement("small");
      empty.textContent = "No location clusters yet. Use place names in the scratchpad or write lines like Place :: memory note.";
      host.append(empty);
      return;
    }
    const featuredPlaces = [
      "Santa Barbara, California",
      "Pomona, California",
      "Glendora, California"
    ].map((value) => canonicalStoryPlaceLabel(value));
    Array.from(groups.entries()).sort((a, b) => {
      const aIndex = featuredPlaces.indexOf(a[0]);
      const bIndex = featuredPlaces.indexOf(b[0]);
      if (aIndex !== -1 || bIndex !== -1) {
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        if (aIndex !== bIndex) return aIndex - bIndex;
      }
      return a[0].localeCompare(b[0]);
    }).forEach(([place, entries]) => {
      const card = document.createElement("article");
      card.className = "story-cluster-card";
      const head = document.createElement("div");
      head.className = "story-cluster-head";
      const title = document.createElement("b");
      title.textContent = place;
      const count = document.createElement("small");
      count.textContent = `${entries.length} local item${entries.length === 1 ? "" : "s"}`;
      head.append(title, count);
      const items = document.createElement("div");
      items.className = "story-cluster-items";
      entries.forEach((entry) => {
        const item = document.createElement("div");
        item.className = "story-cluster-item";
        const source = document.createElement("b");
        source.textContent = entry.source;
        const detail = document.createElement("small");
        detail.textContent = entry.detail;
        item.append(source, detail);
        items.append(item);
      });
      card.append(head, items);
      host.append(card);
    });
  }

  function renderGenealogyView() {
    const host = $("genealogyView");
    if (!host) return;
    host.replaceChildren();
    const familyEntries = state.castTree.filter((entry) => entry.relation === "family" || Number.isFinite(entry.generation));
    if (!familyEntries.length) {
      const empty = document.createElement("small");
      empty.textContent = "Import Greeran.txt or add family-linked cast entries to build a generations view.";
      host.append(empty);
      return;
    }
    const byName = new Map(familyEntries.map((entry) => [normalizeText(entry.name), entry]));
    const memo = new Map();
    function generationOf(entry, trail = new Set()) {
      if (!entry) return 1;
      if (Number.isFinite(entry.generation)) return entry.generation;
      if (memo.has(entry.id)) return memo.get(entry.id);
      if (trail.has(entry.id)) return 1;
      trail.add(entry.id);
      const links = connectionTargets(entry).map((name) => normalizeText(name));
      if (links.includes("self") || !links.length) {
        memo.set(entry.id, 1);
        return 1;
      }
      const levels = links.map((name) => byName.get(name)).filter(Boolean).map((parent) => generationOf(parent, trail) + 1);
      const level = levels.length ? Math.min(...levels) : 1;
      memo.set(entry.id, level);
      return level;
    }
    const columns = new Map([[0, [{ id: "self-root", name: "Steven", relation: "self", branch: "root", note: "Reference point for imported family tree links.", linkDetails: [], links: [] }]]]);
    familyEntries.forEach((entry) => {
      const level = generationOf(entry);
      if (!columns.has(level)) columns.set(level, []);
      columns.get(level).push(entry);
    });
    const legend = document.createElement("div");
    legend.className = "genealogy-branch-legend";
    [
      ["Maternal", "Maternal branch"],
      ["Paternal", "Paternal branch"],
      ["Partner", "Partner branch"],
      ["Descendant", "Descendant branch"],
      ["Immediate", "Immediate family"]
    ].forEach(([label, branch]) => {
      const chip = document.createElement("span");
      const dot = document.createElement("i");
      dot.className = "genealogy-branch-dot";
      dot.style.background = branchColor(branch);
      chip.append(dot, document.createTextNode(label));
      legend.append(chip);
    });
    host.append(legend);
    Array.from(columns.keys()).sort((a, b) => a - b).forEach((level) => {
      const column = document.createElement("section");
      column.className = "genealogy-column";
      const head = document.createElement("b");
      head.textContent = level === 0 ? "Self / root" : `Generation ${level}`;
      column.append(head);
      columns.get(level)
        .slice()
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .forEach((entry) => {
          const card = document.createElement("article");
          card.className = "genealogy-card";
          card.classList.toggle("active", entry.id === state.selectedCastId);
          applyBranchAccent(card, entry.branch);
          const name = document.createElement("b");
          name.textContent = entry.name;
          name.style.color = relationColor(entry.relation);
          const meta = document.createElement("small");
          meta.textContent = [entry.relation, entry.branch, entry.era].filter(Boolean).join(" · ");
          const links = document.createElement("div");
          links.className = "genealogy-links";
          connectionDetails(entry).forEach((link) => {
            const chip = document.createElement("span");
            chip.textContent = formatConnectionLabel(link);
            links.append(chip);
          });
          const note = document.createElement("small");
          note.textContent = entry.note || "No note yet.";
          card.append(name, meta);
          if (connectionDetails(entry).length) card.append(links);
          card.append(note);
          if (entry.id !== "self-root") {
            card.addEventListener("click", () => {
              state.selectedCastId = entry.id;
              renderCastTree();
            });
          }
          column.append(card);
        });
      host.append(column);
    });
  }

  function renderCastTree() {
    const host = $("castTree");
    if (!host) return;
    host.replaceChildren();
    if (!state.castTree.length) {
      const empty = document.createElement("small");
      empty.textContent = "No private cast entries yet. Add family, roommates, mentors, neighbors, or other people here for local-only planning.";
      host.append(empty);
      renderGenealogyView();
      renderCastGraph();
      renderPrivateMilestoneLane();
      return;
    }
    if (!state.castTree.some((entry) => entry.id === state.selectedCastId)) {
      state.selectedCastId = state.castTree[0].id;
    }
    state.castTree.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "cast-card";
      card.classList.toggle("active", state.selectedCastId === entry.id);
      applyBranchAccent(card, entry.branch);
      const b = document.createElement("b");
      b.textContent = entry.name;
      b.style.color = relationColor(entry.relation);
      const small = document.createElement("small");
      small.textContent = entry.note || "No note yet.";
      const tags = document.createElement("div");
      tags.className = "cast-tags";
      [entry.relation, Number.isFinite(entry.generation) ? `gen ${entry.generation}` : "", entry.era, entry.branch, ...connectionDetails(entry).map((value) => formatConnectionLabel(value))].filter(Boolean).forEach((value) => {
        const chip = document.createElement("span");
        chip.textContent = value;
        tags.append(chip);
      });
      const actions = document.createElement("div");
      actions.className = "cast-actions";
      const graphBtn = document.createElement("button");
      graphBtn.type = "button";
      graphBtn.textContent = "Graph";
      graphBtn.addEventListener("click", () => {
        state.selectedCastId = entry.id;
        renderCastTree();
      });
      const noteBtn = document.createElement("button");
      noteBtn.type = "button";
      noteBtn.textContent = "To scratchpad";
      noteBtn.addEventListener("click", () => {
        const lines = [entry.name, entry.relation, entry.era, entry.branch, formatConnectionSummary(entry), entry.note].filter(Boolean).join(" · ");
        state.privateMemo.privateLeads = `${state.privateMemo.privateLeads ? state.privateMemo.privateLeads + "\n" : ""}${lines}`;
        savePrivateMemo();
        syncPrivatePads();
        renderPrivateStoryClusters();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        state.castTree = state.castTree.filter((item) => item.id !== entry.id);
        saveCastTree();
        if (state.selectedCastId === entry.id) state.selectedCastId = "";
        renderCastTree();
      });
      actions.append(graphBtn, noteBtn, remove);
      card.append(b, tags, small, actions);
      card.addEventListener("click", () => {
        state.selectedCastId = entry.id;
        renderCastTree();
      });
      host.append(card);
    });
    renderGenealogyView();
    renderCastGraph();
    renderPrivateMilestoneLane();
  }

  function drawConnectionLabel(ctx, text, x, y, dpr, highlighted) {
    if (!text) return;
    const width = Math.max(42, text.length * 6.4) * dpr;
    const height = 16 * dpr;
    ctx.fillStyle = highlighted ? "rgba(11,18,32,0.92)" : "rgba(11,18,32,0.78)";
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
    ctx.strokeStyle = highlighted ? "rgba(242,201,132,0.9)" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1 * dpr;
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);
    ctx.fillStyle = highlighted ? "#f2c984" : "rgba(243,247,255,0.94)";
    ctx.font = `${9 * dpr}px monospace`;
    ctx.fillText(text, x - (width / 2) + (6 * dpr), y + (3 * dpr));
  }

  function renderCastGraph() {
    const canvas = $("castGraph");
    const detail = $("castGraphDetail");
    if (!canvas || !detail) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(640, Math.round(rect.width * dpr));
    const height = Math.max(320, Math.round((rect.height || rect.width * 0.58) * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0c1320");
    bg.addColorStop(1, "#111a29");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const center = { x: width * 0.5, y: height * 0.5 };
    const entries = state.castTree.map((entry, index) => ({ ...entry, index }));
    const root = { id: "self-root", name: "Steven", relation: "self", x: center.x, y: center.y, r: 20 * dpr };
    const relationOrder = ["family", "mentor", "roommate", "friend", "neighbor", "other"];
    const slots = [];
    relationOrder.forEach((relation, groupIndex) => {
      const group = entries.filter((entry) => entry.relation === relation);
      group.forEach((entry, index) => {
        const ring = 90 * dpr + groupIndex * 24 * dpr;
        const angle = ((index / Math.max(group.length, 1)) * Math.PI * 2) + groupIndex * 0.45;
        const x = center.x + Math.cos(angle) * ring;
        const y = center.y + Math.sin(angle) * ring * 0.68;
        slots.push({ ...entry, x, y, r: 12 * dpr });
      });
    });
    entries.filter((entry) => !relationOrder.includes(entry.relation)).forEach((entry, index) => {
      const angle = (index / Math.max(entries.length, 1)) * Math.PI * 2;
      slots.push({ ...entry, x: center.x + Math.cos(angle) * 160 * dpr, y: center.y + Math.sin(angle) * 110 * dpr, r: 12 * dpr });
    });
    const byName = new Map(slots.map((entry) => [normalizeText(entry.name), entry]));

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, 70 * i * dpr, 46 * i * dpr, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    slots.forEach((entry) => {
      const highlighted = state.selectedCastId === entry.id;
      const accent = branchColor(entry.branch);
      ctx.beginPath();
      ctx.moveTo(root.x, root.y);
      ctx.lineTo(entry.x, entry.y);
      ctx.strokeStyle = highlighted ? `${accent}cc` : `${accent}66`;
      ctx.lineWidth = highlighted ? 2.5 * dpr : 1.2 * dpr;
      ctx.stroke();
    });
    slots.forEach((entry) => {
      connectionDetails(entry).forEach((connection) => {
        const target = normalizeText(connection.target) === "self" ? root : byName.get(normalizeText(connection.target));
        if (!target) return;
        const highlighted = state.selectedCastId === entry.id;
        const accent = branchColor(entry.branch);
        ctx.beginPath();
        ctx.moveTo(entry.x, entry.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = highlighted ? `${accent}bb` : `${accent}55`;
        ctx.lineWidth = highlighted ? 1.5 * dpr : 1 * dpr;
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (connection.label) {
          drawConnectionLabel(
            ctx,
            humanizeToken(connection.label),
            (entry.x + target.x) / 2,
            (entry.y + target.y) / 2,
            dpr,
            highlighted
          );
        }
      });
    });

    state.castHits = [{ id: root.id, x: root.x, y: root.y, r: root.r }];
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.arc(root.x, root.y, root.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(140,232,220,0.55)";
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();
    ctx.fillStyle = "#0b1220";
    ctx.font = `${12 * dpr}px monospace`;
    ctx.fillText(root.name, root.x - 18 * dpr, root.y + 4 * dpr);

    slots.forEach((entry) => {
      const active = state.selectedCastId === entry.id;
      const accent = branchColor(entry.branch);
      ctx.beginPath();
      ctx.fillStyle = relationColor(entry.relation);
      ctx.arc(entry.x, entry.y, active ? 14 * dpr : entry.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = active ? accent : `${accent}99`;
      ctx.lineWidth = active ? 2.5 * dpr : 1.2 * dpr;
      ctx.stroke();
      ctx.fillStyle = "rgba(243,247,255,0.96)";
      ctx.font = `${10.5 * dpr}px sans-serif`;
      ctx.fillText(entry.name, entry.x + 12 * dpr, entry.y - 10 * dpr);
      state.castHits.push({ id: entry.id, x: entry.x, y: entry.y, r: 16 * dpr });
    });

    const activeEntry = state.castTree.find((entry) => entry.id === state.selectedCastId) || state.castTree[0];
    if (activeEntry && !state.selectedCastId) state.selectedCastId = activeEntry.id;
    detail.innerHTML = activeEntry
      ? `<b style="color:${relationColor(activeEntry.relation)}">${escapeHtml(activeEntry.name)}</b><small>${escapeHtml(activeEntry.relation)}${Number.isFinite(activeEntry.generation) ? ` · gen ${escapeHtml(activeEntry.generation)}` : ""}${activeEntry.era ? ` · ${escapeHtml(activeEntry.era)}` : ""}${activeEntry.branch ? ` · ${escapeHtml(activeEntry.branch)}` : ""}</small><p>${escapeHtml(activeEntry.note || "No note yet.")}</p><small>${escapeHtml(connectionDetails(activeEntry).length ? `Links: ${formatConnectionSummary(activeEntry)}` : "No explicit links yet. Add names or labels like parent: self, spouse: Alex, sibling: Nora.")}</small>`
      : '<b>Relationship graph</b><p>Add a cast entry to begin mapping family or social links.</p>';
  }

  function renderResearchMap() {
    const canvas = $("researchMap");
    const detail = $("mapDetail");
    const list = $("mapPlaceList");
    const legend = $("mapLegend");
    if (!canvas || !detail || !list || !legend) return;

    const visible = filteredPlaces();
    const chapterLinkedIds = state.selectedChapterIndex != null
      ? chapterPlaceIds(state.project.chapters[state.selectedChapterIndex])
      : [];

    if (!state.selectedPlaceId || !visible.some((place) => place.id === state.selectedPlaceId)) {
      state.selectedPlaceId = visible[0] ? visible[0].id : "";
    }
    if (state.selectedGooglePathId && !(state.googleTimeline?.paths || []).some((path) => path.id === state.selectedGooglePathId)) {
      state.selectedGooglePathId = "";
    }

    [["mapFilterAll", "all"], ["mapFilterOfficial", "official"], ["mapFilterResume", "self-published"], ["mapFilterPrivate", "private"]].forEach(([id, value]) => {
      const btn = $(id);
      if (btn) btn.classList.toggle("active", state.mapFilter === value);
    });

    legend.replaceChildren();
    [
      ["Official public record", "official"],
      ["Self-published resume", "self-published"],
      ["Private lane / local only", "private"],
      ["Google Timeline route", "google"]
    ].forEach(([label, lane]) => {
      const row = document.createElement("div");
      row.className = "legend-row";
      const dot = document.createElement("span");
      dot.className = "legend-dot";
      dot.style.background = laneColor(lane);
      const text = document.createElement("span");
      text.textContent = label;
      row.append(dot, text);
      legend.append(row);
    });
    const legendNote = document.createElement("small");
    legendNote.textContent = chapterLinkedIds.length
      ? `Chapter focus active: ${chapterLinkedIds.length} linked place${chapterLinkedIds.length === 1 ? "" : "s"}.`
      : "Tip: use a chapter link or chapter Map button to highlight related places.";
    legend.append(legendNote);

    renderChapterLinkList();
    renderTimelineLane();
    renderGoogleTimeline();
    renderManualPins();

    list.replaceChildren();
    visible.forEach((place) => {
      const button = document.createElement("button");
      button.type = "button";
      button.classList.toggle("active", place.id === state.selectedPlaceId || chapterLinkedIds.includes(place.id));
      const b = document.createElement("b");
      b.textContent = place.name;
      b.style.color = laneColor(place.lane);
      const small = document.createElement("small");
      const localTag = place.source === "manual local pin" ? "manual pin · local only" : `${place.lane} · ${place.source}`;
      small.textContent = localTag;
      button.append(b, small);
      button.addEventListener("click", () => {
        state.selectedPlaceId = place.id;
        state.selectedGooglePathId = "";
        renderResearchMap();
      });
      list.append(button);
    });

    const selected = visible.find((place) => place.id === state.selectedPlaceId);
    const selectedRoute = (state.mapFilter === "all" || state.mapFilter === "private")
      ? (state.googleTimeline?.paths || []).find((path) => path.id === state.selectedGooglePathId)
      : null;
    const selectedLinked = chapterLinkedIds.includes(state.selectedPlaceId);
    const chapterName = state.selectedChapterIndex != null ? state.project.chapters[state.selectedChapterIndex]?.title : "";
    detail.innerHTML = selected
      ? `<b style="color:${laneColor(selected.lane)}">${escapeHtml(selected.name)}</b><small>${escapeHtml(selected.lane)} · ${escapeHtml(selected.source)}</small><p>${escapeHtml(selected.summary)}</p><small>${selected.exportable ? "Eligible for public/exported map contexts." : "Local-only marker; excluded from exports and webxdc share."}${selectedLinked && chapterName ? ` Linked to chapter: ${escapeHtml(chapterName)}.` : ""}</small>`
      : selectedRoute
        ? `<b style="color:#7db7ff">${escapeHtml(selectedRoute.label)}</b><small>private · google timeline route</small><p>${escapeHtml(selectedRoute.note || "Imported Google Timeline path.")}</p><small>${selectedRoute.points.length} plotted point${selectedRoute.points.length === 1 ? "" : "s"}${selectedRoute.startTime ? ` · ${escapeHtml(shortDateTime(selectedRoute.startTime))}` : ""}${selectedRoute.endTime ? ` → ${escapeHtml(shortDateTime(selectedRoute.endTime))}` : ""}</small>`
        : '<b>No places visible</b><p>Choose a different filter.</p>';

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(720, Math.round(rect.width * dpr));
    const height = Math.max(420, Math.round((rect.height || rect.width * 0.58) * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    const pad = 52 * dpr;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;

    const lons = visible.map((place) => place.lon);
    const lats = visible.map((place) => place.lat);
    const minLon = Math.min(...lons, -120) - 3;
    const maxLon = Math.max(...lons, -64) + 3;
    const minLat = Math.min(...lats, 17) - 2;
    const maxLat = Math.max(...lats, 39) + 2;
    const project = (lon, lat) => ({
      x: pad + ((lon - minLon) / Math.max(1e-6, maxLon - minLon)) * innerW,
      y: pad + ((maxLat - lat) / Math.max(1e-6, maxLat - minLat)) * innerH
    });

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0c1723");
    bg.addColorStop(0.6, "#122234");
    bg.addColorStop(1, "#182d43");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i <= 6; i += 1) {
      const x = pad + innerW * (i / 6);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, pad);
      ctx.lineTo(x, height - pad);
      ctx.stroke();
      const lon = minLon + (maxLon - minLon) * (i / 6);
      ctx.fillStyle = "rgba(220,231,250,0.65)";
      ctx.font = `${11 * dpr}px sans-serif`;
      ctx.fillText(`${Math.round(Math.abs(lon))}°W`, x - 18 * dpr, height - pad + 20 * dpr);
    }
    for (let i = 0; i <= 4; i += 1) {
      const y = pad + innerH * (i / 4);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(width - pad, y);
      ctx.stroke();
      const lat = maxLat - (maxLat - minLat) * (i / 4);
      ctx.fillStyle = "rgba(220,231,250,0.65)";
      ctx.font = `${11 * dpr}px sans-serif`;
      ctx.fillText(`${Math.round(lat)}°N`, 8 * dpr, y + 4 * dpr);
    }

    const plotted = visible.map((place) => ({ ...place, ...project(place.lon, place.lat) }));
    state.mapHits = plotted.map((place) => ({ id: place.id, x: place.x, y: place.y, r: 12 * dpr }));

    const googleRoutesVisible = state.mapFilter === "all" || state.mapFilter === "private";
    const googleRoutes = googleRoutesVisible ? (state.googleTimeline?.paths || []) : [];
    googleRoutes.forEach((route) => {
      const points = (route.points || []).map((point) => project(point.lon, point.lat));
      if (points.length < 2) return;
      const active = route.id === state.selectedGooglePathId;
      ctx.beginPath();
      points.forEach((point, index) => {
        if (!index) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = active ? "rgba(125,183,255,0.92)" : "rgba(125,183,255,0.22)";
      ctx.lineWidth = active ? 2.6 * dpr : 1.25 * dpr;
      ctx.setLineDash(active ? [] : [4 * dpr, 5 * dpr]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (active) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(125,183,255,0.95)";
        ctx.arc(points[0].x, points[0].y, 4.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        const last = points[points.length - 1];
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.arc(last.x, last.y, 4.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const route = chapterLinkedIds.length > 1
      ? plotted.filter((place) => chapterLinkedIds.includes(place.id))
      : plotted;
    if (route.length > 1) {
      ctx.strokeStyle = chapterLinkedIds.length ? "rgba(140,232,220,0.55)" : "rgba(255,255,255,0.18)";
      ctx.lineWidth = chapterLinkedIds.length ? 2.25 * dpr : 1.5 * dpr;
      ctx.setLineDash([6 * dpr, 6 * dpr]);
      ctx.beginPath();
      route.forEach((place, index) => {
        if (!index) ctx.moveTo(place.x, place.y);
        else ctx.lineTo(place.x, place.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawLabelBox(title, x, y, w, h, fillColor, strokeColor, textColor) {
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5 * dpr;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = textColor;
      ctx.font = `${11 * dpr}px monospace`;
      ctx.fillText(title, x + 10 * dpr, y + 18 * dpr);
    }

    drawLabelBox(
      "SOUTHERN CALIFORNIA",
      project(-118.8, 34.1).x - 44 * dpr,
      project(-118.8, 34.1).y - 30 * dpr,
      140 * dpr,
      72 * dpr,
      "rgba(140,232,220,0.12)",
      "rgba(140,232,220,0.45)",
      "rgba(140,232,220,0.95)"
    );
    drawLabelBox(
      "ST. CROIX / USVI",
      project(-64.8, 17.75).x - 26 * dpr,
      project(-64.8, 17.75).y - 22 * dpr,
      122 * dpr,
      56 * dpr,
      "rgba(242,201,132,0.14)",
      "rgba(242,201,132,0.45)",
      "rgba(242,201,132,0.95)"
    );

    function plotMarker(place, x, y, scale = 1) {
      const active = place.id === state.selectedPlaceId;
      const linked = chapterLinkedIds.includes(place.id);
      if (linked) {
        ctx.beginPath();
        ctx.fillStyle = laneColor(place.lane);
        ctx.globalAlpha = 0.16;
        ctx.arc(x, y, 15 * dpr * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.fillStyle = laneColor(place.lane);
      ctx.globalAlpha = active ? 1 : 0.92;
      ctx.arc(x, y, (active ? 8 : linked ? 7 : 6) * dpr * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = (active ? 3 : linked ? 2 : 1.5) * dpr * scale;
      ctx.strokeStyle = active ? "#ffffff" : linked ? laneColor(place.lane) : "rgba(255,255,255,0.35)";
      ctx.stroke();
      ctx.fillStyle = "rgba(242,246,255,0.95)";
      ctx.font = `${(active ? 12 : 11) * dpr * Math.max(0.9, scale)}px sans-serif`;
      ctx.fillText(place.name, x + 10 * dpr * scale, y - 10 * dpr * scale);
    }

    plotted.forEach((place) => plotMarker(place, place.x, place.y, 1));

    function drawInset(title, x, y, w, h, bounds, idFilter, titleColor) {
      ctx.save();
      ctx.fillStyle = "rgba(7,11,18,0.88)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 1.5 * dpr;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = titleColor;
      ctx.font = `${11 * dpr}px monospace`;
      ctx.fillText(title, x + 10 * dpr, y + 18 * dpr);
      const region = plotted.filter((place) => idFilter(place));
      const padInset = 16 * dpr;
      const mapX = (lon) => x + padInset + ((lon - bounds.minLon) / Math.max(1e-6, bounds.maxLon - bounds.minLon)) * (w - padInset * 2);
      const mapY = (lat) => y + padInset + ((bounds.maxLat - lat) / Math.max(1e-6, bounds.maxLat - bounds.minLat)) * (h - padInset * 2);
      for (let i = 0; i <= 4; i += 1) {
        const gy = y + padInset + ((h - padInset * 2) * i / 4);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        ctx.moveTo(x + padInset, gy);
        ctx.lineTo(x + w - padInset, gy);
        ctx.stroke();
      }
      for (let i = 0; i <= 4; i += 1) {
        const gx = x + padInset + ((w - padInset * 2) * i / 4);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        ctx.moveTo(gx, y + padInset);
        ctx.lineTo(gx, y + h - padInset);
        ctx.stroke();
      }
      region.forEach((place) => {
        const px = mapX(place.lon);
        const py = mapY(place.lat);
        ctx.beginPath();
        ctx.fillStyle = laneColor(place.lane);
        ctx.arc(px, py, 4.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = place.id === state.selectedPlaceId ? 2.5 * dpr : 1.2 * dpr;
        ctx.strokeStyle = place.id === state.selectedPlaceId ? "#fff" : "rgba(255,255,255,0.35)";
        ctx.stroke();
        ctx.fillStyle = "rgba(242,246,255,0.92)";
        ctx.font = `${10 * dpr}px sans-serif`;
        ctx.fillText(place.name.split(",")[0], px + 7 * dpr, py - 5 * dpr);
        state.mapHits.push({ id: place.id, x: px, y: py, r: 9 * dpr });
      });
      ctx.restore();
    }

    drawInset(
      "CALIFORNIA INSET",
      18 * dpr,
      18 * dpr,
      290 * dpr,
      160 * dpr,
      { minLon: -120.4, maxLon: -117.3, minLat: 33.95, maxLat: 34.65 },
      (place) => place.lon >= -120.4 && place.lon <= -117.3 && place.lat >= 33.95 && place.lat <= 34.65,
      "rgba(140,232,220,0.95)"
    );
    drawInset(
      "USVI INSET",
      width - 210 * dpr,
      18 * dpr,
      192 * dpr,
      140 * dpr,
      { minLon: -64.95, maxLon: -64.62, minLat: 17.68, maxLat: 17.79 },
      (place) => place.lon >= -64.95 && place.lon <= -64.62 && place.lat >= 17.68 && place.lat <= 17.79,
      "rgba(242,201,132,0.95)"
    );
  }

  function slugify(value) {
    return String(value || "file")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "file";
  }

  function saveSnapshot() {
    pullMetaControls();
    saveProject();
    const snap = {
      id: `snap-${Date.now().toString(36)}`,
      title: state.project.meta.title,
      when: new Date().toLocaleString(),
      template: currentTemplate().label,
      chapterCount: state.project.chapters.length,
      project: deepClone(state.project)
    };
    state.snapshots.unshift(snap);
    state.snapshots = state.snapshots.slice(0, 20);
    saveSnapshots();
    renderStats();
    renderSnapshots();
  }

  function downloadText(name, text, mime) {
    const blob = new Blob([text], { type: mime || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function encodeBase64Utf8(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function runtimeBuildViewerDocument(project) {
    function esc(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
    function phtml(text) {
      return String(text || "")
        .split(/\n{2,}/)
        .map(function (block) {
          return block
            .split(/\n/)
            .map(function (line) { return esc(line); })
            .join("<br />");
        })
        .map(function (block) { return "<p>" + block + "</p>"; })
        .join("");
    }
    const paper = project.design && project.design.paperTheme || "field-notes";
    const chrome = project.design && project.design.viewerChrome || "folio";
    const stamp = project.design && project.design.coverStamp || "WORKING EDITION";
    const showPrompts = !project.options || project.options.showPrompts !== false;
    const showEvidence = !project.options || project.options.showEvidence !== false;
    const includeSources = !project.options || project.options.includeSources !== false;
    const chapters = (project.chapters || []).map(function (chapter, index) {
      const layout = ["cover", "divider", "chapter"].includes(chapter.layout) ? chapter.layout : "chapter";
      const open = '<section class="chapter ' + layout + '-page">';
      if (layout === 'cover') {
        return [
          open,
          '<div class="chapter-no">', String(index + 1).padStart(2, "0"), '</div>',
          '<div class="cover-kicker">', esc(chapter.evidence || 'section'), '</div>',
          '<h2>', esc(chapter.title), '</h2>',
          showPrompts ? '<div class="prompt"><b>Prompt:</b> ' + esc(chapter.prompt || "") + '</div>' : '',
          '<div class="body">', phtml(chapter.body || ""), '</div>',
          '</section>'
        ].join("");
      }
      if (layout === 'divider') {
        return [
          open,
          '<div class="divider-rule"></div>',
          '<div class="chapter-no">', String(index + 1).padStart(2, "0"), '</div>',
          '<h2>', esc(chapter.title), '</h2>',
          showEvidence ? '<div class="badge">' + esc(chapter.evidence || "prompt") + '</div>' : '',
          showPrompts ? '<div class="prompt">' + esc(chapter.prompt || "") + '</div>' : '',
          '</section>'
        ].join("");
      }
      return [
        open,
        '<div class="chapter-no">', String(index + 1).padStart(2, "0"), '</div>',
        '<h2>', esc(chapter.title), '</h2>',
        showEvidence ? '<div class="badge">' + esc(chapter.evidence || "prompt") + '</div>' : '',
        showPrompts ? '<div class="prompt"><b>Prompt:</b> ' + esc(chapter.prompt || "") + '</div>' : '',
        '<div class="body">', phtml(chapter.body || ""), '</div>',
        '</section>'
      ].join("");
    }).join("");
    const sources = includeSources ? [
      '<section class="sources">',
      '<h2>Sources</h2>',
      '<ol>',
      (project.sources || []).map(function (source) {
        return '<li><span class="src-tier">' + esc(source.tier || "source") + '</span><a href="' + esc(source.url || "#") + '" target="_blank" rel="noopener">' + esc(source.label || source.url || "source") + '</a></li>';
      }).join(""),
      '</ol>',
      '</section>'
    ].join("") : "";

    return '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="UTF-8" />' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />' +
      '<title>' + esc(project.meta && project.meta.title || 'Book Viewer') + '</title>' +
      '<style>' +
      ':root{--bg:#f2ecde;--paper:#fbf7ef;--paper-2:#efe5d1;--ink:#241d15;--muted:#665a49;--accent:#7e5e1b;--line:#c8b99b;--sans:system-ui,-apple-system,Segoe UI,sans-serif;--serif:Iowan Old Style,Palatino Linotype,Palatino,Georgia,serif;--mono:SFMono-Regular,Consolas,monospace}' +
      'body{margin:0;background:linear-gradient(180deg,#e8e1d1,var(--bg));color:var(--ink);font-family:var(--serif)}' +
      'body[data-paper="field-notes"] main{background:repeating-linear-gradient(180deg,transparent 0 32px,rgba(63,93,165,.09) 32px 33px),linear-gradient(90deg,rgba(183,64,47,.15) 0 52px,transparent 52px),var(--paper)}' +
      'body[data-paper="ambassador-ledger"] main{background:repeating-linear-gradient(180deg,transparent 0 34px,rgba(0,0,0,.08) 34px 35px),repeating-linear-gradient(90deg,transparent 0 150px,rgba(0,0,0,.06) 150px 151px),var(--paper)}' +
      'body[data-paper="rag-paper"] main{background:radial-gradient(circle at 20% 20%,rgba(255,255,255,.35),transparent 22%),radial-gradient(circle at 80% 10%,rgba(0,0,0,.03),transparent 18%),var(--paper)}' +
      'body[data-paper="blueprint"] main{--bg:#102137;--paper:#17304d;--paper-2:#1c3c60;--ink:#f1f6ff;--muted:#bdd3f8;--accent:#8ce8dc;--line:rgba(200,226,255,.18);background:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px),var(--paper);background-size:22px 22px,22px 22px,auto}' +
      'body[data-paper="night-reader"]{--bg:#0c1017;--paper:#111723;--paper-2:#1a2231;--ink:#edf3ff;--muted:#a8b6d2;--accent:#8ce8dc;--line:rgba(140,232,220,.16)}' +
      'header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:12px 18px;border-bottom:1px solid var(--line);background:rgba(255,250,242,.88);backdrop-filter:blur(10px);font-family:var(--sans)}' +
      'body[data-paper="blueprint"] header,body[data-paper="night-reader"] header{background:rgba(11,15,24,.85)}' +
      'header b{font:700 11px/1 var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}' +
      'header .right{display:flex;gap:8px;flex-wrap:wrap}' +
      'header button{border:1px solid var(--line);background:rgba(255,255,255,.55);color:var(--ink);padding:8px 12px;border-radius:999px;cursor:pointer;font:700 11px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase}' +
      'main{max-width:920px;margin:18px auto 40px;padding:28px 26px 48px;border:1px solid var(--line);border-radius:24px;box-shadow:0 18px 50px rgba(0,0,0,.12)}' +
      'body[data-chrome="minimal"] main{border-radius:10px;box-shadow:none}' +
      'body[data-chrome="console"] main{border-radius:18px;box-shadow:0 18px 60px rgba(0,0,0,.3);border-color:rgba(140,232,220,.16)}' +
      '.cover{position:relative;padding:14px 0 26px;border-bottom:2px solid var(--line)}' +
      '.stamp{position:absolute;right:0;top:0;transform:rotate(-8deg);border:2px solid var(--accent);color:var(--accent);padding:8px 12px;border-radius:6px;font:700 11px/1.3 var(--mono);letter-spacing:.16em;text-transform:uppercase;text-align:center}' +
      '.kicker{font:700 11px/1 var(--mono);letter-spacing:.22em;text-transform:uppercase;color:var(--muted)}' +
      'h1{margin:8px 0 10px;font-size:clamp(32px,5vw,52px);line-height:1.02}' +
      '.sub{margin:0 0 12px;font:400 18px/1.5 var(--sans);color:var(--muted)}' +
      '.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:14px}' +
      '.meta div{border:1px solid var(--line);border-radius:16px;padding:10px 12px;background:rgba(255,255,255,.28)}' +
      '.meta span{display:block;font:700 10px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:5px}' +
      '.method{margin:22px 0;border-left:4px solid var(--accent);padding:14px 16px;background:rgba(255,255,255,.35);font:400 15px/1.7 var(--sans)}' +
      '.chapter{padding:22px 0;border-top:1px solid var(--line);position:relative}' +
      '.chapter.cover-page{min-height:58vh;display:flex;flex-direction:column;justify-content:center;padding:40px 12px 44px;text-align:center}' +
      '.chapter.divider-page{min-height:34vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:34px 12px}' +
      '.chapter.cover-page .body,.chapter.divider-page .body{max-width:40rem;margin:0 auto}' +
      '.chapter.divider-page .divider-rule{width:72px;height:2px;background:var(--accent);margin:0 auto 18px}' +
      '.chapter.cover-page .cover-kicker{font:700 11px/1 var(--mono);letter-spacing:.24em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}' +
      '.chapter-no{font:700 11px/1 var(--mono);letter-spacing:.22em;text-transform:uppercase;color:var(--accent)}' +
      '.chapter.cover-page .chapter-no,.chapter.divider-page .chapter-no{margin-bottom:10px}' +
      '.chapter h2{margin:8px 0 10px;font-size:31px;line-height:1.08}' +
      '.chapter.cover-page h2{font-size:clamp(36px,6vw,58px);line-height:1.02;margin:8px 0 14px}' +
      '.chapter.divider-page h2{font-size:clamp(28px,5vw,42px);line-height:1.06;margin:8px 0 14px}' +
      '.badge{display:inline-block;border:1px solid var(--line);padding:5px 9px;border-radius:999px;font:700 10px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}' +
      '.prompt{margin:0 0 12px;color:var(--muted);font:400 14px/1.6 var(--sans)}' +
      '.body p{margin:0 0 12px;font-size:18px;line-height:1.8}' +
      '.sources{margin-top:28px;padding-top:22px;border-top:2px solid var(--line)}' +
      '.sources h2{margin:0 0 12px;font-size:28px}' +
      '.sources ol{margin:0;padding-left:20px}' +
      '.sources li{margin:0 0 12px;font:400 14px/1.6 var(--sans)}' +
      '.sources a{color:inherit}' +
      '.src-tier{display:block;font:700 10px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}' +
      '@media (max-width:720px){main{padding:20px 18px 34px;margin:0;border-radius:0;border-left:0;border-right:0}header{position:static;flex-direction:column;align-items:flex-start}.stamp{position:static;transform:none;display:inline-block;margin-bottom:12px}.chapter h2{font-size:25px}.body p{font-size:17px}}' +
      '</style>' +
      '</head>' +
      '<body data-paper="' + esc(paper) + '" data-chrome="' + esc(chrome) + '">' +
      '<header><b>Book Viewer</b><div class="right"><button type="button" id="btnSelf">Download viewer</button></div></header>' +
      '<main>' +
      '<section class="cover">' +
      '<div class="stamp">' + esc(stamp) + '</div>' +
      '<div class="kicker">Source-balanced autobiography model</div>' +
      '<h1>' + esc(project.meta && project.meta.title || 'Untitled book') + '</h1>' +
      '<p class="sub">' + esc(project.meta && project.meta.subtitle || '') + '</p>' +
      '<div class="meta"><div><span>Author line</span>' + esc(project.meta && project.meta.authorLine || '') + '</div><div><span>Edition</span>' + esc(project.meta && project.meta.editionNote || '') + '</div><div><span>Updated</span>' + esc(project.updatedAt || '') + '</div></div>' +
      '</section>' +
      '<section class="method">' + esc(project.methodNote || '') + '</section>' +
      chapters +
      sources +
      '</main>' +
      '<script>document.getElementById("btnSelf").onclick=function(){var html="<!DOCTYPE html>"+document.documentElement.outerHTML;var blob=new Blob([html],{type:"text/html"});var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="' + esc(slugify(project.meta && project.meta.title || "book-viewer")) + '-viewer.html";a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);};</' + 'script>' +
      '</body></html>';
  }

  function runtimeBuildInstallerDocument(project) {
    const projectB64 = encodeBase64Utf8(JSON.stringify(project));
    const viewerFn = runtimeBuildViewerDocument.toString();
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${escapeHtml(project.meta.title)} — SFX installer</title>
<style>
:root{--bg:#080b10;--panel:#101520;--panel-2:#171d2a;--line:rgba(140,232,220,.18);--text:#edf3ff;--muted:#99abca;--accent:#8ce8dc;--accent-2:#f2c984;--mono:SFMono-Regular,Consolas,monospace;--sans:system-ui,-apple-system,Segoe UI,sans-serif;--shadow:0 18px 50px rgba(0,0,0,.35)}
*{box-sizing:border-box}body{margin:0;font-family:var(--sans);background:linear-gradient(135deg,#06080d,#101827);color:var(--text)}
header{position:sticky;top:0;z-index:3;display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:16px 18px;border-bottom:1px solid var(--line);background:rgba(7,10,16,.86);backdrop-filter:blur(12px)}
header h1{margin:3px 0 6px;font-size:26px;line-height:1.05}header p{margin:0;color:var(--muted);max-width:70ch;line-height:1.5}
header b,.k{display:block;font:700 10px/1 var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}
main{display:grid;grid-template-columns:300px minmax(0,1fr);gap:16px;padding:18px;align-items:start}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow);overflow:hidden}.panel h2{margin:0;padding:14px 16px 0;font-size:18px}.pad{padding:16px}
.controls{display:grid;gap:12px}.controls label{display:grid;gap:6px}.controls span{font:700 10px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
select,input[type="text"]{width:100%;padding:11px 12px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--text)}
.check{display:flex;gap:10px;align-items:center;padding:11px 12px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.05)}.check span{margin:0;letter-spacing:.08em}
.actions{display:grid;gap:10px}.actions button{border:1px solid var(--line);background:rgba(255,255,255,.05);color:var(--text);border-radius:999px;padding:10px 12px;cursor:pointer;font:700 11px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase}.actions button.hot{color:var(--accent-2);border-color:rgba(242,201,132,.34)}
iframe{width:100%;min-height:78vh;border:0;border-top:1px solid var(--line);background:#fff;display:block}.log{margin:0;padding:16px;color:#c4d2eb;font:400 12px/1.55 var(--mono);white-space:pre-wrap}
@media (max-width:980px){header{position:static;flex-direction:column}main{grid-template-columns:1fr}iframe{min-height:60vh}}
</style>
</head>
<body>
<header>
  <div>
    <b>Self-extracting book installer</b>
    <h1>${escapeHtml(project.meta.title)}</h1>
    <p>Open the embedded viewer, tune the paper and display toggles, extract a standalone viewer HTML file, export the project JSON, or use the quine button to download this installer itself.</p>
  </div>
  <div class="actions">
    <button type="button" id="btnViewer">Extract viewer.html</button>
    <button type="button" id="btnProject">Extract project.json</button>
    <button type="button" id="btnSelf" class="hot">Download this SFX</button>
    <button type="button" id="btnShare">Share via webxdc</button>
  </div>
</header>
<main>
  <section class="panel">
    <h2>Viewer options</h2>
    <div class="pad controls">
      <label><span>Paper</span><select id="paper"><option value="field-notes">Field notes</option><option value="ambassador-ledger">Ambassador ledger</option><option value="rag-paper">Rag paper</option><option value="blueprint">Blueprint</option><option value="night-reader">Night reader</option></select></label>
      <label><span>Viewer chrome</span><select id="chrome"><option value="folio">Folio</option><option value="minimal">Minimal</option><option value="console">Console</option></select></label>
      <label><span>Cover stamp</span><input id="stamp" type="text" maxlength="24" /></label>
      <label class="check"><input id="showPrompts" type="checkbox" /><span>Show prompts</span></label>
      <label class="check"><input id="showEvidence" type="checkbox" /><span>Show evidence labels</span></label>
      <label class="check"><input id="includeSources" type="checkbox" /><span>Include sources appendix</span></label>
    </div>
  </section>
  <section class="panel">
    <h2>Viewer</h2>
    <iframe id="frame" title="Embedded book viewer"></iframe>
    <pre id="log" class="log"></pre>
  </section>
</main>
<script>
(function(){
  if (!window.webxdc) {
    var updates = [];
    window.webxdc = {
      selfAddr: 'preview@local',
      selfName: 'Preview',
      sendUpdate: function(update){ updates.push(Object.assign({ serial: updates.length + 1 }, update)); },
      setUpdateListener: function(cb){ updates.forEach(function(u){ cb(u); }); return Promise.resolve(); }
    };
  }
  var PROJECT = JSON.parse((function(b64){ var bin = atob(b64); var bytes = new Uint8Array(bin.length); for (var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return new TextDecoder().decode(bytes); })(${JSON.stringify(projectB64)}));
  var buildViewer = ${viewerFn};
  var frame = document.getElementById('frame');
  var logEl = document.getElementById('log');
  function log(msg){ logEl.textContent += msg + '\n'; }
  function readProject(){
    var next = JSON.parse(JSON.stringify(PROJECT));
    next.design.paperTheme = document.getElementById('paper').value;
    next.design.viewerChrome = document.getElementById('chrome').value;
    next.design.coverStamp = document.getElementById('stamp').value.trim() || 'WORKING EDITION';
    next.options.showPrompts = document.getElementById('showPrompts').checked;
    next.options.showEvidence = document.getElementById('showEvidence').checked;
    next.options.includeSources = document.getElementById('includeSources').checked;
    next.updatedAt = new Date().toISOString();
    return next;
  }
  function render(){ frame.srcdoc = buildViewer(readProject()); }
  function download(name, text, mime){ var blob = new Blob([text], { type: mime || 'text/plain' }); var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(function(){ URL.revokeObjectURL(url); }, 1000); }
  document.getElementById('paper').value = PROJECT.design.paperTheme || 'field-notes';
  document.getElementById('chrome').value = PROJECT.design.viewerChrome || 'folio';
  document.getElementById('stamp').value = PROJECT.design.coverStamp || 'WORKING EDITION';
  document.getElementById('showPrompts').checked = PROJECT.options.showPrompts !== false;
  document.getElementById('showEvidence').checked = PROJECT.options.showEvidence !== false;
  document.getElementById('includeSources').checked = PROJECT.options.includeSources !== false;
  ['paper','chrome','stamp','showPrompts','showEvidence','includeSources'].forEach(function(id){ document.getElementById(id).addEventListener('input', render); document.getElementById(id).addEventListener('change', render); });
  document.getElementById('btnViewer').onclick = function(){ var current = readProject(); download('${slugify(project.meta.title)}-viewer.html', buildViewer(current), 'text/html'); log('viewer extracted'); };
  document.getElementById('btnProject').onclick = function(){ var current = readProject(); download('${slugify(project.meta.title)}-project.json', JSON.stringify(current, null, 2), 'application/json'); log('project json extracted'); };
  document.getElementById('btnSelf').onclick = function(){ download('${slugify(project.meta.title)}-sfx.html', '<!DOCTYPE html>' + document.documentElement.outerHTML, 'text/html'); log('installer re-downloaded from inside itself'); };
  document.getElementById('btnShare').onclick = function(){ var current = readProject(); if (window.webxdc && window.webxdc.sendUpdate) { window.webxdc.sendUpdate({ payload:{ type:'book-builder-project', project: current }, summary:'Book Builder: ' + current.meta.title }); log('shared to webxdc host'); } else { log('webxdc unavailable'); } };
  if (window.webxdc && window.webxdc.setUpdateListener) {
    window.webxdc.setUpdateListener(function(update){ if (!update || !update.payload) return; log('update ' + (update.serial || '?') + ' · ' + (update.summary || 'book data')); });
  }
  log('boot · sfx viewer ready');
  log('title · ${escapeHtml(project.meta.title)}');
  render();
})();
</script>
</body>
</html>`;
  }

  function refreshViewerPreview() {
    $("viewerFrame").srcdoc = runtimeBuildViewerDocument(projectForExport());
  }

  function refreshSfxPreview() {
    $("sfxFrame").srcdoc = runtimeBuildInstallerDocument(projectForExport());
  }

  function renderProjectDump() {
    $("projectDump").textContent = JSON.stringify(state.project, null, 2);
  }

  function queuePreviewRefresh() {
    clearTimeout(state.previewTimer);
    state.previewTimer = setTimeout(() => {
      refreshViewerPreview();
      refreshSfxPreview();
      renderProjectDump();
    }, 120);
  }

  function onProjectEdit(rebuildChapters) {
    pullMetaControls();
    saveProject();
    renderStats();
    if (rebuildChapters) renderChapterList();
    queuePreviewRefresh();
    renderTemplateShelf();
  }

  function exportProjectJson() {
    pullMetaControls();
    saveProject();
    const project = projectForExport();
    downloadText(`${slugify(project.meta.title)}-project.json`, JSON.stringify(project, null, 2), "application/json");
  }

  function exportViewerHtml() {
    pullMetaControls();
    saveProject();
    const project = projectForExport();
    downloadText(`${slugify(project.meta.title)}-viewer.html`, runtimeBuildViewerDocument(project), "text/html");
  }

  function exportInstallerHtml() {
    pullMetaControls();
    saveProject();
    const project = projectForExport();
    downloadText(`${slugify(project.meta.title)}-sfx.html`, runtimeBuildInstallerDocument(project), "text/html");
  }

  function exportQuineSfx() {
    exportInstallerHtml();
  }

  function appendXdcEntry(title, detail, loader) {
    const host = $("xdcLog");
    const entry = document.createElement("article");
    entry.className = "xdc-entry";
    const b = document.createElement("b");
    b.textContent = title;
    const small = document.createElement("small");
    small.textContent = detail;
    entry.append(b, small);
    if (typeof loader === "function") {
      const actions = document.createElement("div");
      actions.className = "snapshot-actions";
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Load";
      button.addEventListener("click", loader);
      actions.append(button);
      entry.append(actions);
    }
    host.prepend(entry);
  }

  function shareToWebxdc() {
    pullMetaControls();
    saveProject();
    const project = projectForExport();
    const payload = {
      type: "book-builder-project",
      project
    };
    if (window.webxdc && window.webxdc.sendUpdate) {
      window.webxdc.sendUpdate({ payload, summary: `Book Builder: ${project.meta.title}` }, "book-builder-project");
      appendXdcEntry("Shared project", `${project.meta.title} · ${project.chapters.length} chapters`);
    } else {
      appendXdcEntry("webxdc unavailable", "The preview stub cannot send outside this browser session.");
    }
  }

  function initWebxdc() {
    if (!window.webxdc || !window.webxdc.setUpdateListener) {
      appendXdcEntry("webxdc stub", "Running in browser preview mode.");
      return;
    }
    window.webxdc.setUpdateListener((update) => {
      if (!update || !update.payload) return;
      if (update.payload.type !== "book-builder-project" || !update.payload.project) {
        appendXdcEntry("Incoming update", update.summary || "Unsupported payload received");
        return;
      }
      const incomingProject = update.payload.project;
      appendXdcEntry(
        incomingProject.meta?.title || "Incoming project",
        `${update.summary || "book-builder project"}`,
        () => {
          state.project = ensureProjectShape(deepClone(incomingProject));
          saveProject();
          renderEverything();
        }
      );
    });
    appendXdcEntry("webxdc ready", `Linked as ${(window.webxdc.selfName || "Preview")}`);
  }

  function bindMetaControls() {
    [
      "bookTitle",
      "bookSubtitle",
      "authorLine",
      "editionNote",
      "methodNote",
      "paperTheme",
      "viewerChrome",
      "coverStamp",
      "showPrompts",
      "showEvidence",
      "includeSources"
    ].forEach((id) => {
      const el = $(id);
      el.addEventListener("input", () => onProjectEdit(false));
      el.addEventListener("change", () => onProjectEdit(false));
    });
  }

  function bindPrivatePads() {
    const publicPad = $("publicLeadPad");
    const privatePad = $("privateLeadPad");
    if (publicPad) {
      publicPad.addEventListener("input", () => {
        state.privateMemo.publicLeads = publicPad.value;
        savePrivateMemo();
      });
    }
    if (privatePad) {
      privatePad.addEventListener("input", () => {
        state.privateMemo.privateLeads = privatePad.value;
        savePrivateMemo();
        renderPrivateStoryClusters();
      });
    }
  }

  function bindFictionLab() {
    [
      ["fictionStoryTitle", "storyTitle"],
      ["fictionStorySubtitle", "storySubtitle"],
      ["fictionNomDePlume", "nomDePlume"],
      ["fictionProtagonistAlias", "protagonistAlias"]
    ].forEach(([id, key]) => {
      $(id)?.addEventListener("input", () => {
        state.fictionLegend[key] = $(id).value;
        saveFictionLegend();
        renderFictionLab();
        queuePreviewRefresh();
      });
    });

    $("fictionSeparateTimeline")?.addEventListener("change", () => {
      state.fictionLegend.separateTimeline = $("fictionSeparateTimeline").checked;
      saveFictionLegend();
      renderFictionLab();
      queuePreviewRefresh();
    });

    $("sfxPrivacyMode")?.addEventListener("change", () => {
      state.fictionLegend.exportMode = $("sfxPrivacyMode").value === "fiction" ? "fiction" : "autobiography";
      saveFictionLegend();
      queuePreviewRefresh();
    });

    $("magnetScenePad")?.addEventListener("input", () => {
      state.fictionLegend.sceneText = $("magnetScenePad").value;
      saveFictionLegend();
    });

    $("addFictionAliasBtn")?.addEventListener("click", () => {
      const real = $("fictionRealName").value.trim();
      const alias = $("fictionAliasName").value.trim();
      if (!real || !alias) {
        window.alert("Both the real label and the fiction alias are required.");
        return;
      }
      state.fictionLegend.entries.unshift({
        id: `fx-${Date.now().toString(36)}`,
        real,
        alias,
        kind: $("fictionAliasKind").value
      });
      $("fictionRealName").value = "";
      $("fictionAliasName").value = "";
      saveFictionLegend();
      renderFictionLab();
      queuePreviewRefresh();
    });

    $("clearFictionLegendBtn")?.addEventListener("click", () => {
      if (!state.fictionLegend.entries.length) return;
      if (!window.confirm("Clear the local fiction legend?")) return;
      state.fictionLegend.entries = [];
      saveFictionLegend();
      renderFictionLab();
      queuePreviewRefresh();
    });

    $("clearMagnetBoardBtn")?.addEventListener("click", () => {
      state.fictionLegend.boardTokens = [];
      if (!state.fictionLegend.sceneText.trim()) state.fictionLegend.sceneText = "";
      saveFictionLegend();
      renderFictionLab();
    });
  }

  function bindPhotoSlots() {
    $("photoInput")?.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file || !state.pendingPhotoSlotId) return;
      const slot = state.photoSlots.find((item) => item.id === state.pendingPhotoSlotId);
      if (!slot) return;
      const reader = new FileReader();
      reader.onload = () => {
        slot.dataUrl = String(reader.result || "");
        savePhotoSlots();
        renderPhotoSlots();
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    });
  }

  function bindDnaMatchHelper() {
    $("addDnaMatchBtn")?.addEventListener("click", () => {
      const name = $("dnaMatchName").value.trim();
      if (!name) {
        window.alert("DNA match name is required.");
        return;
      }
      const entry = {
        id: `dna-${Date.now().toString(36)}`,
        name,
        side: $("dnaMatchSide").value,
        sharedPercent: Number.isFinite(Number($("dnaMatchPercent").value)) ? Number($("dnaMatchPercent").value) : null,
        sharedCm: Number.isFinite(Number($("dnaMatchCm").value)) ? Number($("dnaMatchCm").value) : null,
        relationGuess: $("dnaMatchRelation").value.trim(),
        linkedPerson: $("dnaMatchLinkedPerson").value.trim(),
        note: $("dnaMatchNote").value.trim()
      };
      state.dnaMatches.unshift(entry);
      saveDnaMatches();
      $("dnaMatchName").value = "";
      $("dnaMatchPercent").value = "";
      $("dnaMatchCm").value = "";
      $("dnaMatchRelation").value = "";
      $("dnaMatchLinkedPerson").value = "";
      $("dnaMatchNote").value = "";
      $("dnaMatchSide").value = "unknown";
      renderDnaMatchHelper();
    });

    $("clearDnaMatchBtn")?.addEventListener("click", () => {
      if (!state.dnaMatches.length) return;
      if (!window.confirm("Clear the local-only DNA match helper from this browser?")) return;
      state.dnaMatches = [];
      saveDnaMatches();
      renderDnaMatchHelper();
    });
  }

  function bindPrivateMilestoneLane() {
    $("addPrivateMilestoneBtn")?.addEventListener("click", () => {
      const title = $("privateMilestoneTitle").value.trim();
      if (!title) {
        window.alert("Event label is required.");
        return;
      }
      const entry = {
        id: `milestone-${Date.now().toString(36)}`,
        title,
        era: $("privateMilestoneEra").value.trim(),
        place: $("privateMilestonePlace").value.trim(),
        people: $("privateMilestonePeople").value.trim(),
        linkedCastNames: parseMilestoneCastNames($("privateMilestoneLinks").value),
        photoDataUrl: "",
        note: $("privateMilestoneNote").value.trim()
      };
      entry.category = milestoneCategory($("privateMilestoneCategory")?.value, entry);
      state.privateMilestones.unshift(entry);
      savePrivateMilestones();
      $("privateMilestoneTitle").value = "";
      $("privateMilestoneEra").value = "";
      $("privateMilestonePlace").value = "";
      $("privateMilestonePeople").value = "";
      $("privateMilestoneLinks").value = "";
      $("privateMilestoneNote").value = "";
      if ($("privateMilestoneCategory")) $("privateMilestoneCategory").value = "";
      renderPrivateMilestoneLane();
      renderPrivateStoryClusters();
      renderResearchMap();
    });

    $("privateMilestonePhotoInput")?.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file || !state.pendingMilestonePhotoId) return;
      const entry = state.privateMilestones.find((item) => item.id === state.pendingMilestonePhotoId);
      state.pendingMilestonePhotoId = "";
      if (!entry) return;
      const reader = new FileReader();
      reader.onload = () => {
        entry.photoDataUrl = String(reader.result || "");
        savePrivateMilestones();
        renderPrivateMilestoneLane();
        renderPrivateStoryClusters();
        renderResearchMap();
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    });

    $("clearPrivateMilestoneBtn")?.addEventListener("click", () => {
      if (!state.privateMilestones.length) return;
      if (!window.confirm("Clear the local-only milestone cards from this browser?")) return;
      state.privateMilestones = [];
      savePrivateMilestones();
      renderPrivateMilestoneLane();
      renderPrivateStoryClusters();
      renderResearchMap();
    });
  }

  function bindArtifactLane() {
    $("addArtifactBtn")?.addEventListener("click", () => {
      const title = $("artifactTitle").value.trim();
      if (!title) {
        window.alert("Label is required.");
        return;
      }
      const entry = {
        id: `artifact-${Date.now().toString(36)}`,
        title,
        kind: $("artifactKind").value,
        era: $("artifactEra").value.trim(),
        place: $("artifactPlace").value.trim(),
        marking: $("artifactMarking").value.trim(),
        note: $("artifactNote").value.trim()
      };
      state.artifactLane.unshift(entry);
      saveArtifactLane();
      $("artifactTitle").value = "";
      $("artifactEra").value = "";
      $("artifactPlace").value = "";
      $("artifactMarking").value = "";
      $("artifactNote").value = "";
      renderArtifactLane();
      renderPrivateStoryClusters();
    });

    $("clearArtifactBtn")?.addEventListener("click", () => {
      if (!state.artifactLane.length) return;
      if (!window.confirm("Clear the local-only objects lane from this browser?")) return;
      state.artifactLane = [];
      saveArtifactLane();
      renderArtifactLane();
      renderPrivateStoryClusters();
    });
  }

  function bindCastTree() {
    $("addCastBtn")?.addEventListener("click", () => {
      const name = $("castName").value.trim();
      if (!name) {
        window.alert("Name is required.");
        return;
      }
      const linkDetails = parseConnectionList($("castLinks").value);
      const entry = {
        id: `cast-${Date.now().toString(36)}`,
        name,
        relation: $("castRelation").value,
        era: $("castEra").value.trim(),
        branch: $("castBranch").value.trim(),
        generation: null,
        linkDetails,
        links: linkDetails.map((item) => item.target),
        note: $("castNote").value.trim()
      };
      state.castTree.unshift(entry);
      state.selectedCastId = entry.id;
      saveCastTree();
      $("castName").value = "";
      $("castEra").value = "";
      $("castBranch").value = "";
      $("castLinks").value = "";
      $("castNote").value = "";
      renderCastTree();
    });

    $("clearCastBtn")?.addEventListener("click", () => {
      if (!state.castTree.length) return;
      if (!window.confirm("Clear the private cast lane from this browser?")) return;
      state.castTree = [];
      state.selectedCastId = "";
      saveCastTree();
      renderCastTree();
    });

    $("castGraph")?.addEventListener("click", (event) => {
      const canvas = $("castGraph");
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const x = (event.clientX - rect.left) * dpr;
      const y = (event.clientY - rect.top) * dpr;
      const hit = state.castHits.find((item) => {
        const dx = item.x - x;
        const dy = item.y - y;
        return dx * dx + dy * dy <= item.r * item.r;
      });
      if (!hit || hit.id === "self-root") return;
      state.selectedCastId = hit.id;
      renderCastTree();
    });

    $("castGraph")?.addEventListener("pointermove", (event) => {
      const canvas = $("castGraph");
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const x = (event.clientX - rect.left) * dpr;
      const y = (event.clientY - rect.top) * dpr;
      const hit = state.castHits.find((item) => {
        const dx = item.x - x;
        const dy = item.y - y;
        return dx * dx + dy * dy <= item.r * item.r;
      });
      canvas.style.cursor = hit ? "pointer" : "default";
    });

    $("castTreeImportInput")?.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        const scope = $("castTreeImportScope")?.value === "direct" ? "direct" : "full";
        const imported = await importCastTreeTextFile(file, { scope });
        const existingNames = new Set(state.castTree.map((entry) => normalizeText(entry.name)));
        const added = [];
        imported.forEach((entry) => {
          if (existingNames.has(normalizeText(entry.name))) return;
          state.castTree.push(entry);
          added.push(entry);
          existingNames.add(normalizeText(entry.name));
        });
        if (added.length) state.selectedCastId = added[0].id;
        saveCastTree();
        renderCastTree();
      } catch (error) {
        window.alert(`Family tree import failed: ${error.message}`);
      } finally {
        event.target.value = "";
      }
    });
  }

  function bindManualPins() {
    $("addPinBtn")?.addEventListener("click", () => {
      const name = $("pinName").value.trim();
      const lat = Number($("pinLat").value.trim());
      const lon = Number($("pinLon").value.trim());
      const lane = $("pinLane").value;
      const summary = $("pinSummary").value.trim() || "Local-only manual pin.";
      if (!name) {
        window.alert("Pin label is required.");
        return;
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        window.alert("Latitude and longitude must be valid numbers.");
        return;
      }
      const pin = {
        id: `manual-${Date.now().toString(36)}`,
        name,
        lat,
        lon,
        lane,
        source: "manual local pin",
        exportable: false,
        summary
      };
      state.localPins.unshift(pin);
      saveManualPins();
      state.selectedPlaceId = pin.id;
      state.selectedGooglePathId = "";
      $("pinName").value = "";
      $("pinLat").value = "";
      $("pinLon").value = "";
      $("pinSummary").value = "";
      renderResearchMap();
      renderChapterList();
    });

    $("clearPinsBtn")?.addEventListener("click", () => {
      if (!state.localPins.length) return;
      if (!window.confirm("Clear all manual pins from this browser?")) return;
      state.localPins = [];
      saveManualPins();
      state.project.chapters.forEach((chapter) => {
        chapter.placeIds = ensureChapterPlaceIds(chapter).filter((id) => !String(id).startsWith("manual-"));
      });
      renderResearchMap();
      renderChapterList();
    });
  }

  function bindGoogleTimeline() {
    $("googleTimelineInput")?.addEventListener("change", async (event) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;
      try {
        const imported = await importGoogleTimelineFiles(files);
        state.googleTimeline = imported;
        saveGoogleTimeline();
        state.selectedPlaceId = imported.places[0]?.id || "";
        state.selectedGooglePathId = imported.paths[0]?.id || "";
        renderResearchMap();
        renderChapterList();
      } catch (error) {
        window.alert(`Google Timeline import failed: ${error.message}`);
      } finally {
        event.target.value = "";
      }
    });

    $("clearGoogleTimelineBtn")?.addEventListener("click", () => {
      const hasImport = state.googleTimeline?.places?.length || state.googleTimeline?.events?.length;
      if (!hasImport) return;
      if (!window.confirm("Clear imported Google Timeline data from this browser?")) return;
      state.googleTimeline = emptyGoogleTimeline();
      state.selectedGooglePathId = "";
      saveGoogleTimeline();
      state.project.chapters.forEach((chapter) => {
        chapter.placeIds = ensureChapterPlaceIds(chapter).filter((id) => !String(id).startsWith("gtl-"));
      });
      if (String(state.selectedPlaceId || "").startsWith("gtl-")) state.selectedPlaceId = "";
      renderResearchMap();
      renderChapterList();
    });
  }

  function bindMap() {
    const filters = [["mapFilterAll", "all"], ["mapFilterOfficial", "official"], ["mapFilterResume", "self-published"], ["mapFilterPrivate", "private"]];
    filters.forEach(([id, value]) => {
      const button = $(id);
      if (!button) return;
      button.addEventListener("click", () => {
        state.mapFilter = value;
        renderResearchMap();
      });
    });
    $("clearChapterFocus")?.addEventListener("click", () => {
      state.selectedChapterIndex = null;
      renderResearchMap();
    });
    const canvas = $("researchMap");
    if (canvas) {
      canvas.addEventListener("click", (event) => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const x = (event.clientX - rect.left) * dpr;
        const y = (event.clientY - rect.top) * dpr;
        let best = null;
        let bestD = Infinity;
        state.mapHits.forEach((hit) => {
          const dx = hit.x - x;
          const dy = hit.y - y;
          const d = dx * dx + dy * dy;
          if (d < hit.r * hit.r && d < bestD) {
            best = hit.id;
            bestD = d;
          }
        });
        if (best) {
          state.selectedPlaceId = best;
          state.selectedGooglePathId = "";
          renderResearchMap();
        }
      });
      canvas.addEventListener("pointermove", (event) => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const x = (event.clientX - rect.left) * dpr;
        const y = (event.clientY - rect.top) * dpr;
        const hit = state.mapHits.find((item) => {
          const dx = item.x - x;
          const dy = item.y - y;
          return dx * dx + dy * dy < item.r * item.r;
        });
        canvas.style.cursor = hit ? "pointer" : "default";
      });
    }
  }

  function activateStagePanel(panelId) {
    $$(".stage-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.panel === panelId));
    $$(".stage-panel").forEach((panel) => {
      const active = panel.id === panelId;
      panel.hidden = !active;
      panel.classList.toggle("active", active);
    });
    if (panelId === "viewer") refreshViewerPreview();
    if (panelId === "sfx") refreshSfxPreview();
    if (panelId === "map") renderResearchMap();
    if (panelId === "project") renderProjectDump();
  }

  function bindTabs() {
    $$(".stage-tab").forEach((button) => {
      button.addEventListener("click", () => {
        activateStagePanel(button.dataset.panel);
      });
    });
  }

  function bindActions() {
    $("addChapterBtn").addEventListener("click", addChapter);
    $("snapshotBtn").addEventListener("click", saveSnapshot);
    $("clearSnapshotsBtn").addEventListener("click", () => {
      if (!state.snapshots.length) return;
      if (!window.confirm("Clear all snapshots?")) return;
      state.snapshots = [];
      saveSnapshots();
      renderStats();
      renderSnapshots();
    });
    $("refreshViewerBtn").addEventListener("click", refreshViewerPreview);
    $("refreshSfxBtn").addEventListener("click", refreshSfxPreview);
    $("downloadProjectBtn").addEventListener("click", exportProjectJson);
    $("downloadViewerBtn").addEventListener("click", exportViewerHtml);
    $("downloadInstallerBtn").addEventListener("click", exportInstallerHtml);
    $("downloadQuineBtn").addEventListener("click", exportQuineSfx);
    $("shareWebxdcBtn").addEventListener("click", shareToWebxdc);
    $("exportGoogleTimelineCsvBtn")?.addEventListener("click", exportGoogleTimelineCsv);
    $("exportGoogleTimelineKmlBtn")?.addEventListener("click", exportGoogleTimelineKml);
    $("importProjectInput").addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || "{}"));
          if (!parsed.meta || !Array.isArray(parsed.chapters)) throw new Error("invalid project shape");
          state.project = ensureProjectShape(parsed);
          saveProject();
          renderEverything();
          appendXdcEntry("Imported project JSON", parsed.meta.title || "Untitled book");
        } catch (error) {
          window.alert(`Import failed: ${error.message}`);
        }
      };
      reader.readAsText(file);
      event.target.value = "";
    });
  }

  function renderEverything() {
    syncMetaControls();
    syncPrivatePads();
    syncFictionControls();
    renderTemplateShelf();
    renderFictionLab();
    renderChapterList();
    renderDnaMatchHelper();
    renderArtifactLane();
    renderPrivateMilestoneLane();
    renderPrivateStoryClusters();
    renderPhotoSlots();
    renderCastTree();
    renderStats();
    renderSnapshots();
    refreshViewerPreview();
    refreshSfxPreview();
    renderResearchMap();
    renderProjectDump();
  }

  addEventListener("resize", () => {
    renderResearchMap();
    renderCastGraph();
  });

  seedResearchLeadNotes();
  seedPrivatePromptNotes();
  seedPrivateCastTree();
  seedPrivateArtifactLane();
  seedPrivateMilestones();
  bindMetaControls();
  bindPrivatePads();
  bindFictionLab();
  bindPhotoSlots();
  bindDnaMatchHelper();
  bindArtifactLane();
  bindPrivateMilestoneLane();
  bindCastTree();
  bindManualPins();
  bindGoogleTimeline();
  bindMap();
  bindTabs();
  bindActions();
  initWebxdc();
  renderEverything();
})();
