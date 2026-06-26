const BASE = 'https://edbesyritkmfadbstswd.supabase.co/storage/v1/object/public/gifs';

export type LessonDetail = {
  karakteristik?: string[];
  pemicu?: string[];
  kapanBeristirahat?: string[];
  segeraKonsultasi?: string[];
  tipsLatihan?: string[];
  gerakanUtama?: string[];
};

export type EducationLesson = {
  id: number;

  icon?: string;
  color?: string;

  type?: 'warmup' | 'cooldown';

  title: string;
  subtitle?: string;
  description: string;

  duration?: string;
  exercise?: string;
  


  thumbnail?: string;
  gif?: string;
  video?: string;

  hasDetail?: boolean;
  detail?: LessonDetail;
};

export type EducationTopic = {
  id: number;

  type:
    | 'running'
    | 'injury'
    | 'warmup'
    | 'strength';

  title: string;
  description: string;

  icon: string;
  color: string;

  heroDescription: string;

  hasVideo?: boolean;

  lessons: EducationLesson[];
};

export const educationData: EducationTopic[] = [
  // ─── 1. Teknik Berlari — plain (tidak ada sub-card) ──────────────────────
  {
    id: 1,
    title: 'Teknik berlari yang benar',
    description: 'Sempurnakan gaya lari Anda, tingkatkan efisiensi, dan kurangi kelelahan',
    icon: 'walk',
    color: '#D9E2FF',
    heroDescription:
      'Kuasai teknik berlari yang efisien dan bebas cedera. Penyesuaian kecil pada postur dan ritme langkah Anda dapat membuat setiap kilometer terasa lebih ringan.',
    hasVideo: true,
    type: 'running',
    lessons: [
      {
        id: 1,
        title: 'Pertahankan Postur Tubuh yang Tegak',
        description:
          'Bayangkan ada tali yang menarik tubuh Anda ke atas dari bagian atas kepala. Jaga agar sikap tetap terbuka, bahu rileks dan tidak terangkat. Tubuh Anda akan secara alami condong ke depan dari pergelangan kaki, bukan pinggang.',
        },
      {
        id: 2,
        title: 'Optimalkan Pijakan Kaki',
        description:
          'Usahakan mendarat dengan lembut di bagian tengah telapak kaki, menjaga agar massa tubuh tetap di bawah pusat gravitasi tubuh Anda. Mendarat dengan hentakan jauh di depan tubuh bertindak sebagai gaya penggerak dan meningkatkan beban pada sendi-sendi Anda.',
     },
      {
        id: 3,
        title: 'Ayunan Lengan yang Ringkas',
        description:
          'Jaga agar siku sekitar 90 derajat. Ayunkan tangan dari pinggang hingga ke bawah dagu, bukan melintasi tubuh Anda. Tangan rileks tetapi bengkok, sedikit menutup tanpa menggenggam keras.',
      },
    ],
  },

  // ─── 2. Pencegahan Cedera — card (ada sub-halaman) ───────────────────────
  {
    id: 2,
    title: 'Pencegahan Cedera',
    description: 'Rutinitas penguatan yang penting dan protokol pemulihan.',
    icon: 'shield-checkmark',
    color: '#E3E1FF',
    heroDescription:
      'Pahami cara melindungi tubuh Anda dari cedera umum pelari. Strategi pencegahan yang tepat membantu Anda tetap berlatih konsisten sepanjang tahun.',
    hasVideo: false,
    type: 'injury',
    lessons: [
      {
        id: 1,
        title: "Runner's Knee",
        subtitle: '(Patellofemoral Pain Syndrome)',
        description:
          'peradangan atau iritasi pada tulang rawan di bawah tempurung lutut (patella). Cedera ini biasanya dipicu oleh gesekan berlebih akibat beban lari yang terlalu berat, otot paha depan (quadriceps) yang lemah, atau ketidakseimbangan mekanis pada panggul dan telapak kaki.',
        hasDetail: true,
        detail: {
          karakteristik: [
            'Nyeri berlari seperti berlari di sekitar, di bawah, atau di bagian depan tempurung lutut.',
            'Nyeri bertambah saat berlari menanjak/menurun, berlari dalam waktu lama, atau saat lutut ditekuk lama (bioskop).',
            'Terasa seperti lutut "mengunci" atau terasa kaku setelah duduk lama.',
          ],
          pemicu: [
            'Peningkatan intensitas/jarak lari yang terlalu mendadak.',
            'Berlari di permukaan keras (aspal/beton) atau menggunakan sepatu yang tidak sesuai.',
            'Otot paha depan (quadriceps) yang lemah, atau jalur iliotibial yang terlalu kencang.',
          ],
          kapanBeristirahat: [
            'Rasa sakit atau ngilu tumpul di sekitar atau di bawah tempurung kaki yang selalu muncul setelah mencapai jarak atau durasi lari tertentu.',
            'Nyeri terasa semakin jelas saat Anda melakukan aktivitas lutut yang lebih berat seperti memanjat/menuruni tangga, berjongkok, duduk tekuk, atau lutut ditekuk (movie theater sign).',
            'Terdengar bunyi gemeretak halus saat lutut ditekuk atau diluruskan, disertai rasa tidak nyaman (namun tanpa rasa sakit yang menusuk tajam).',
          ],
          segeraKonsultasi: [
            'Sakit tidak lagi seperti biasa: sekarang tajam dan intens, melainkan tajam ke tulang rawan dan ingin meminta Anda berhenti berjalan biasa.',
            'Lutut mengalami pembengkakan secara signifikan, terasa hangat saat disentuh, atau terlihat lebih besar dibandingkan lutut yang sehat.',
            'Lutut terasa tidak stabil (seperti ingin lepas melompong tanggal) atau terasa "terkunci"/"terhenti" sehingga tidak bisa diluruskan/ditekuk secara penuh.',
            'Setelah melakukan istirahat selama beberapa hari, nyeri kembali muncul segera setelah Anda mulai berjalan atau bahkan saat berjalan biasa.',
          ],
        },
      },
      {
        id: 2,
        title: 'Shin Splints',
        subtitle: '(Medial Tibial Stress Syndrome)',
        description:
          'cedera akibat peradangan pada otot, tendon, dan jaringan tulang di sekitar tulang kering (tibia). Cedera ini sangat sering mengintai pelari yang terlalu cepat menaikkan jarak tempuh, berlari di permukaan keras seperti aspal, atau memiliki bentuk telapak kaki datar (overpronation).',
        hasDetail: true,
        detail: {
          karakteristik: [
            'Nyeri berdenyut atau nyeri tajam di sepanjang tepi tulang kering bagian dalam.',
            'Nyeri biasanya terasa saat memulai lari dan mereda setelah pemanasan, namun kembali setelah berlari selesai.',
            'Area tulang kering terasa nyeri jika ditekan.',
          ],
          pemicu: [
            'Peningkatan intensitas/jarak lari yang terlalu mendadak, berlari di permukaan keras (aspal/beton).',
            'Berlari dengan sepatu yang sudah aus atau tidak memberikan dukungan yang cukup.',
            'Menggunakan sepatu yang terlalu datar tanpa lengkungan yang tepat.',
          ],
          kapanBeristirahat: [
            'Rasa sakit berdenyut atau tegang di sepanjang sepertiga bagian bawah tulang kering saat Anda baru mulai berlari. Nyeri ini terkadang mereda setelah otot memanas, tetapi kembali lagi setelah sesi lari selesai.',
            ' Area di sepanjang tepi dalam tulang kering terasa sangat peka atau sakit saat Anda menekannya dengan jari.',
            'Kaki bagian bawah terasa kaku dan berdenyut bahkan berjam-jam setelah Anda selesai berlari atau keesokan paginya saat bangun tidur.'
          ],
          segeraKonsultasi: [
            'Jika rasa sakit tidak lagi memanjang di area tulang kering, melainkan terpusat dan sangat tajam pada satu titik spesifik seukuran ujung jari (ini adalah tanda utama stress fracture).',
            'Nyeri tidak lagi hanya muncul saat berlari, tetapi membuat Anda kesulitan atau pincang saat berjalan santai dalam aktivitas sehari-hari..',
            'Tulang kering terasa berdenyut sakit bahkan saat Anda sedang duduk diam atau berbaring di malam hari.',
            'Muncul benjolan atau pembengkakan lokal di area tulang kering yang terasa hangat saat disentuh.',
            'Terdapat sensasi kebas, kesemutan, atau telapak kaki terasa sangat dingin, yang bisa menjadi indikasi awal Compartment Syndrome (pembengkakan otot yang menekan saraf dan pembuluh darah).'
          ],
        },
      },
      {
        id: 3,
        title: 'Plantar Fasciitis',
        subtitle: '',
        description:
          'peradangan pada pita jaringan tebal (plantar fascia) yang membentang di bagian bawah telapak kaki, menghubungkan tulang tumit ke jari-jari kaki. Cedera ini sering dipicu oleh ketegangan ekstrem pada telapak kaki akibat otot betis yang terlalu kaku, peningkatan jarak lari yang drastis, atau penggunaan sepatu dengan topangan lengkungan (arch support) yang tidak memadai.',
        hasDetail: true,
        detail: {
          karakteristik: [
            'Nyeri tajam di bagian bawah tumit atau sepanjang lengkungan kaki.',
            'Paling parah pada langkah pertama di pagi hari atau setelah duduk lama.',
            'Nyeri biasanya berkurang setelah beberapa langkah tetapi bisa kembali setelah aktivitas panjang.',
          ],
          pemicu: [
            'Berlari terlalu banyak di permukaan keras dengan sepatu yang tidak memiliki bantalan lengkungan yang baik.',
            'Otot betis yang kencang memberi tekanan lebih pada plantar fascia.',
            'Menggunakan sepatu dengan bentuk flat feet atau lingkungan tinggi (high arches).',
          ],
          kapanBeristirahat: [
            'Sensasi seperti tertusuk jarum atau kaca di bagian bawah tumit pada langkah-langkah pertama saat baru bangun tidur.',
            'Nyeri serupa muncul kembali saat Anda melangkah setelah duduk bekerja atau berkendara dalam waktu yang lama.',
            'Rasa sakit sering kali memudar atau hilang setelah beberapa menit Anda berlari (karena jaringan memanas), tetapi kembali berdenyut hebat begitu tubuh mulai dingin setelah sesi lari selesai.'
          ],
          segeraKonsultasi: [
            'Rasa sakit begitu hebat hingga Anda tidak mampu menopang berat badan pada tumit yang sakit saat berjalan aktivitas biasa.',
            'Tumit atau telapak kaki terasa sangat sakit dan berdenyut bahkan saat Anda sedang berbaring tidur di malam hari.',
            'Muncul sensasi kebas, kesemutan, atau seperti tersengat listrik di telapak kaki (ini bisa menjadi tanda Tarsal Tunnel Syndrome atau terjepitnya saraf di pergelangan kaki).',
            'Area tumit terlihat membengkak secara fisik, memerah, atau terasa panas saat diraba.',
            'Anda sudah melakukan istirahat total, ice rolling, dan peregangan secara konsisten selama beberapa minggu, namun intensitas nyeri tidak berkurang sama sekali.'
          ],
        },
      },
      {
  id: 5,

  title: 'Achilles Tendinitis',

  subtitle: 'Iliotibial Band Syndrome',

  description:
    'peradangan pada tendon Achilles, yaitu pita jaringan kuat yang menghubungkan otot betis ke tulang tumit. Cedera ini sangat sering dipicu oleh penambahan porsi latihan kecepatan (speed work) yang mendadak, rute lari menanjak (hill repeats) yang berlebihan, atau kondisi otot betis yang terlalu kaku dan pendek.',
     hasDetail: true,
  detail: {

    karakteristik: [
      'Nyeri tajam di sisi luar lutut yang sering kali menjalar hingga ke paha bagian luar. Nyeri biasanya memburuk saat tumit menyentuh tanah.',
    ],

    pemicu: [
      'Gesekan berlebih pada ligamen ITB akibat kelemahan otot bokong (glutes) atau berlari di jalan yang miring.',
    ],

    kapanBeristirahat: [
      'Area di atas tumit bagian belakang terasa sangat kaku, tegang, dan nyeri saat Anda mengambil langkah pertama di pagi hari.',
      'Muncul rasa sakit tumpul atau sensasi hangat/terbakar di sepanjang tendon saat awal berlari atau sesaat setelah menyelesaikan sesi lari.',
      'Terasa ada sedikit pembengkakan atau penebalan pada tendon saat dijepit perlahan dengan dua jari (dibandingkan dengan kaki yang tidak sakit).'
    ],

    segeraKonsultasi: [
      'Anda mendengar atau merasakan sensasi robekan/suara "pop" keras di belakang pergelangan kaki, sering kali terasa seolah-olah ada yang menendang betis Anda dari belakang.',
      'Anda sama sekali tidak bisa mengangkat tumit dari lantai (tidak bisa berjinjit) pada kaki yang sakit, atau telapak kaki tidak bisa didorong ke bawah.',
      'Rasa sakit yang tajam, hebat, dan datang secara tiba-tiba sehingga Anda langsung tidak bisa berjalan.',
      'Terlihat cekungan aneh pada tendon (tanda putus), disertai memar kebiruan dan pembengkakan besar di area pergelangan kaki belakang.',
      'Nyeri tidak membaik sama sekali meski Anda sudah beristirahat total dari aktivitas lari selama lebih dari dua minggu.'
    ],

  },
},
      {
  id: 6,

  title: 'IT Band Syndrome',

  subtitle: 'Iliotibial Band Syndrome',

  description:
    'cedera iritasi akibat gesekan berlebih pada pita jaringan ikat tebal (iliotibial band) yang membentang dari pinggul, menyusuri sisi luar paha, hingga ke bawah lutut. Cedera ini adalah musuh utama pelari jarak jauh dan sering dipicu oleh kelemahan otot penstabil pinggul (gluteus medius), rute lari yang menurun, atau permukaan jalan yang miring.',
     hasDetail: true,
  detail: {

    karakteristik: [
      'Nyeri tajam di sisi luar lutut yang sering kali menjalar hingga ke paha bagian luar. Nyeri biasanya memburuk saat tumit menyentuh tanah.',
    ],

    pemicu: [
      'Gesekan berlebih pada ligamen ITB akibat kelemahan otot bokong (glutes) atau berlari di jalan yang miring.',
    ],

    kapanBeristirahat: [
      'Area di atas tumit bagian belakang terasa sangat kaku, tegang, dan nyeri saat Anda mengambil langkah pertama di pagi hari.',
      'Nyeri terasa paling intens tepat saat tumit menyentuh tanah atau saat lutut sedikit ditekuk (sekitar sudut 30 derajat).',
      'Berjalan menuruni tangga atau lintasan lari yang menurun (downhill) memicu rasa sakit yang jauh lebih nyata dibandingkan saat berjalan datar atau menanjak.'
    ],

    segeraKonsultasi: [
      'Lutut terasa "tersangkut", berbunyi klik keras yang menyakitkan, atau tidak bisa diluruskan dan ditekuk secara penuh.',
      'Area sisi luar lutut mengalami pembengkakan fisik yang besar, memerah, atau terasa panas saat disentuh (ITBS murni umumnya tidak memicu bengkak yang terlalu terlihat).',
      'Rasa sakit disertai sensasi kesemutan atau mati rasa yang menjalar ke bawah lutut atau ke area punggung bawah.',
      'Lutut luar terasa berdenyut hebat bahkan saat Anda sedang duduk santai atau tidak memberikan beban berat badan pada kaki tersebut.',
      'Anda sudah beristirahat dari aktivitas lari dan melakukan penguatan pinggul selama lebih dari 3–4 minggu, namun rasa sakit tetap muncul seketika saat Anda mencoba berlari kembali.'
    ],

  },
},
    ],
  },

  // ─── 3. Pemanasan & Pendinginan — card ───────────────────────────────────
  {
    id: 3,
    title: 'Pemanasan & Pendinginan',
    description:
      'Lakukan peregangan dinamis untuk memulai dan peregangan statis untuk mengakhiri sesi dengan benar.',
    icon: 'pulse',
    color: '#6BFF8F',
    heroDescription:
      'Pemanasan dan pendinginan yang tepat adalah bingkai dari setiap sesi lari yang baik. Ini bukan opsional — ini adalah bagian dari latihan itu sendiri.',
    hasVideo: true,
    type: 'warmup',
    lessons: [
      {
        id: 1,
        title: 'High knees',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Mengaktifkan otot fleksor pinggul dan bokong (glutes), serta melatih postur angkatan kaki yang ideal saat berlari.',
        hasDetail: false,
        type: 'warmup',
        gif: `${BASE}/education/pemanasan_pendinginan/pemanasan/High%20Knees.gif`,
      },
     {
        id: 2,
        title: 'Butt Kicks',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Memanaskan otot paha belakang (hamstrings) secara aktif dan meningkatkan kelincahan langkah kaki.',
        hasDetail: false,
        type: 'warmup',
        gif: `${BASE}/education/pemanasan_pendinginan/pemanasan/Butt%20Kicks.gif`,
      },
      {
        id: 3,
        title: 'Leg Swings',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Membuka mobilitas sendi pinggul agar jangkauan langkah (stride) lebih leluasa dan tidak kaku.',
        hasDetail: false,
        type: 'warmup',
        gif: `${BASE}/education/mobilitas/Leg%20Swing.gif`,
      },
      {
        id: 4,
        title: 'Walking Lunges',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Membangunkan kelompok otot besar (paha depan, paha belakang, dan bokong) sekaligus melatih keseimbangan tubuh.',
        hasDetail: false,
        type: 'warmup',
        gif: `${BASE}/education/pemanasan_pendinginan/pemanasan/Walking%20Lunges.gif`,
      },
      {
        id: 5,
        title: 'Jumping Jack',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Gerakan kardio menyeluruh untuk menaikkan detak jantung dengan cepat dan menyelaraskan koordinasi tubuh.',
        hasDetail: false,
        type: 'warmup',
        gif: `${BASE}/education/pemanasan_pendinginan/pemanasan/Jumping%20Jack.gif`,
      },
      {
        id: 6,
        title: 'Hamstring Stretch',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Membantu merelaksasi otot paha belakang setelah kontraksi berulang saat berlari, mencegah kekakuan otot.',
        hasDetail: false,
        type: 'cooldown',
        gif: `${BASE}/education/pemanasan_pendinginan/pendinginan/Hamstring%20Stretch.gif`,
      },
     {
        id: 7,
        title: 'Quad Stretch',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Memanaskan otot paha belakang (hamstrings) secara aktif dan meningkatkan kelincahan langkah kaki.',
        hasDetail: false,
        type: 'cooldown',
        gif: `${BASE}/education/pemanasan_pendinginan/pendinginan/Quad%20Stretch.gif`,
      },
      {
        id: 8,
        title: 'Calf Stretch',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Membuka mobilitas sendi pinggul agar jangkauan langkah (stride) lebih leluasa dan tidak kaku.',
        hasDetail: false,
        type: 'cooldown',
        gif: `${BASE}/education/pemanasan_pendinginan/pendinginan/Calf%20Stretch.gif`,
      },
      {
        id: 9,
        title: 'Cross-Body Shoulder Stretch',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Membangunkan kelompok otot besar (paha depan, paha belakang, dan bokong) sekaligus melatih keseimbangan tubuh.',
        hasDetail: false,
        type: 'cooldown',
        gif: `${BASE}/education/pemanasan_pendinginan/pendinginan/Cross-Body%20Shoulder%20Stretch.gif`,
      },
      {
        id: 10,
        title: 'Child Pose',
        subtitle: 'Mengapa Hal Ini Penting:',
        description: 'Gerakan kardio menyeluruh untuk menaikkan detak jantung dengan cepat dan menyelaraskan koordinasi tubuh.',
        hasDetail: false,
        type: 'cooldown',
        gif: `${BASE}/education/pemanasan_pendinginan/pendinginan/Child%20Pose.gif`,
      },
    ],
  },

  // ─── 4. Latihan Kekuatan — card ───────────────────────────────────────────
  {
    id: 4,

    title: 'Latihan Kekuatan Untuk Pelari Pemula',

    description:
      'Bangun kekuatan otot untuk meningkatkan performa lari, menjaga stabilitas tubuh, dan membantu mengurangi risiko cedera.',

    icon: 'barbell',

    color: '#FFE5D6',

    heroDescription:
      'Bangun kekuatan, stabilitas, dan cegah cedera untuk performa lari yang lebih baik.',

    hasVideo: false,

    type: 'strength',

    lessons: [

      {
        id: 1,

        icon: 'barbell',
        color: '#FFE5D6',

        title: 'Strength',

        subtitle:
          'Otot kaki & inti',

        description:
          '',

        hasDetail: true,
      },

      {
        id: 2,

        icon: 'body',
        color: '#D9E2FF',

        title: 'Core',

        subtitle:
          'Stabilitas postur',

        description:
          '',

        hasDetail: true,
      },

      {
        id: 3,

        icon: 'walk',
        color: '#CFFFE2',

        title: 'Mobility',

        subtitle:
          'Rentang gerak',

        description:
          '',

        hasDetail: true,
      },

      {
        id: 4,

        icon: 'moon',
        color: '#ECECEC',

        title: 'Recovery',

        subtitle:
          'Pemulihan otot',

        description:
          '',

        hasDetail: true,
      },

    ],
  },
];