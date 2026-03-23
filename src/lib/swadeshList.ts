export interface SwadeshWord {
  id: string
  english: string
  filipino: string
  category: string
  priority: number
}

export const SWADESH_LIST: SwadeshWord[] = [
  // Pronouns
  { id: 'sw-001', english: 'I', filipino: 'ako', category: 'pronouns', priority: 1 },
  { id: 'sw-002', english: 'you', filipino: 'ikaw', category: 'pronouns', priority: 1 },
  { id: 'sw-003', english: 'he/she', filipino: 'siya', category: 'pronouns', priority: 1 },
  { id: 'sw-004', english: 'we', filipino: 'tayo/kami', category: 'pronouns', priority: 1 },
  { id: 'sw-005', english: 'they', filipino: 'sila', category: 'pronouns', priority: 1 },
  // Body parts
  { id: 'sw-006', english: 'head', filipino: 'ulo', category: 'body', priority: 1 },
  { id: 'sw-007', english: 'hair', filipino: 'buhok', category: 'body', priority: 2 },
  { id: 'sw-008', english: 'eye', filipino: 'mata', category: 'body', priority: 1 },
  { id: 'sw-009', english: 'ear', filipino: 'tainga', category: 'body', priority: 1 },
  { id: 'sw-010', english: 'nose', filipino: 'ilong', category: 'body', priority: 1 },
  { id: 'sw-011', english: 'mouth', filipino: 'bibig', category: 'body', priority: 1 },
  { id: 'sw-012', english: 'tooth', filipino: 'ngipin', category: 'body', priority: 2 },
  { id: 'sw-013', english: 'tongue', filipino: 'dila', category: 'body', priority: 2 },
  { id: 'sw-014', english: 'hand', filipino: 'kamay', category: 'body', priority: 1 },
  { id: 'sw-015', english: 'foot', filipino: 'paa', category: 'body', priority: 1 },
  { id: 'sw-016', english: 'heart', filipino: 'puso', category: 'body', priority: 1 },
  { id: 'sw-017', english: 'blood', filipino: 'dugo', category: 'body', priority: 2 },
  { id: 'sw-018', english: 'bone', filipino: 'buto', category: 'body', priority: 2 },
  // Nature
  { id: 'sw-019', english: 'water', filipino: 'tubig', category: 'nature', priority: 1 },
  { id: 'sw-020', english: 'fire', filipino: 'apoy', category: 'nature', priority: 1 },
  { id: 'sw-021', english: 'earth/soil', filipino: 'lupa', category: 'nature', priority: 1 },
  { id: 'sw-022', english: 'sky', filipino: 'langit', category: 'nature', priority: 1 },
  { id: 'sw-023', english: 'sun', filipino: 'araw', category: 'nature', priority: 1 },
  { id: 'sw-024', english: 'moon', filipino: 'buwan', category: 'nature', priority: 1 },
  { id: 'sw-025', english: 'star', filipino: 'bituin', category: 'nature', priority: 2 },
  { id: 'sw-026', english: 'rain', filipino: 'ulan', category: 'nature', priority: 1 },
  { id: 'sw-027', english: 'wind', filipino: 'hangin', category: 'nature', priority: 1 },
  { id: 'sw-028', english: 'river', filipino: 'ilog', category: 'nature', priority: 1 },
  { id: 'sw-029', english: 'mountain', filipino: 'bundok', category: 'nature', priority: 1 },
  { id: 'sw-030', english: 'tree', filipino: 'puno', category: 'nature', priority: 1 },
  { id: 'sw-031', english: 'stone/rock', filipino: 'bato', category: 'nature', priority: 2 },
  { id: 'sw-032', english: 'sand', filipino: 'buhangin', category: 'nature', priority: 2 },
  { id: 'sw-033', english: 'sea/ocean', filipino: 'dagat', category: 'nature', priority: 1 },
  // Family
  { id: 'sw-034', english: 'mother', filipino: 'nanay/ina', category: 'family', priority: 1 },
  { id: 'sw-035', english: 'father', filipino: 'tatay/ama', category: 'family', priority: 1 },
  { id: 'sw-036', english: 'child', filipino: 'anak', category: 'family', priority: 1 },
  { id: 'sw-037', english: 'woman', filipino: 'babae', category: 'family', priority: 1 },
  { id: 'sw-038', english: 'man', filipino: 'lalaki', category: 'family', priority: 1 },
  { id: 'sw-039', english: 'person/human', filipino: 'tao', category: 'family', priority: 1 },
  { id: 'sw-040', english: 'name', filipino: 'pangalan', category: 'family', priority: 1 },
  // Animals
  { id: 'sw-041', english: 'bird', filipino: 'ibon', category: 'animals', priority: 1 },
  { id: 'sw-042', english: 'fish', filipino: 'isda', category: 'animals', priority: 1 },
  { id: 'sw-043', english: 'dog', filipino: 'aso', category: 'animals', priority: 1 },
  { id: 'sw-044', english: 'snake', filipino: 'ahas', category: 'animals', priority: 2 },
  { id: 'sw-045', english: 'worm', filipino: 'uod', category: 'animals', priority: 3 },
  // Actions
  { id: 'sw-046', english: 'eat', filipino: 'kumain', category: 'actions', priority: 1 },
  { id: 'sw-047', english: 'drink', filipino: 'uminom', category: 'actions', priority: 1 },
  { id: 'sw-048', english: 'sleep', filipino: 'matulog', category: 'actions', priority: 1 },
  { id: 'sw-049', english: 'walk', filipino: 'lumakad', category: 'actions', priority: 1 },
  { id: 'sw-050', english: 'come', filipino: 'halika/pumunta', category: 'actions', priority: 1 },
  { id: 'sw-051', english: 'die', filipino: 'mamatay', category: 'actions', priority: 2 },
  { id: 'sw-052', english: 'kill', filipino: 'pumatay', category: 'actions', priority: 2 },
  { id: 'sw-053', english: 'say/speak', filipino: 'magsalita', category: 'actions', priority: 1 },
  { id: 'sw-054', english: 'see/look', filipino: 'tumingin/makita', category: 'actions', priority: 1 },
  { id: 'sw-055', english: 'hear', filipino: 'marinig', category: 'actions', priority: 1 },
  { id: 'sw-056', english: 'know', filipino: 'alam', category: 'actions', priority: 1 },
  { id: 'sw-057', english: 'think', filipino: 'mag-isip', category: 'actions', priority: 2 },
  { id: 'sw-058', english: 'give', filipino: 'ibigay', category: 'actions', priority: 1 },
  { id: 'sw-059', english: 'hold/grab', filipino: 'hawak', category: 'actions', priority: 2 },
  // Descriptors
  { id: 'sw-060', english: 'big/large', filipino: 'malaki', category: 'descriptors', priority: 1 },
  { id: 'sw-061', english: 'small/little', filipino: 'maliit', category: 'descriptors', priority: 1 },
  { id: 'sw-062', english: 'long', filipino: 'mahaba', category: 'descriptors', priority: 2 },
  { id: 'sw-063', english: 'short', filipino: 'maikli', category: 'descriptors', priority: 2 },
  { id: 'sw-064', english: 'good', filipino: 'mabuti/maganda', category: 'descriptors', priority: 1 },
  { id: 'sw-065', english: 'bad', filipino: 'masama', category: 'descriptors', priority: 1 },
  { id: 'sw-066', english: 'hot', filipino: 'mainit', category: 'descriptors', priority: 1 },
  { id: 'sw-067', english: 'cold', filipino: 'malamig', category: 'descriptors', priority: 1 },
  { id: 'sw-068', english: 'new', filipino: 'bago', category: 'descriptors', priority: 2 },
  { id: 'sw-069', english: 'old', filipino: 'matanda/luma', category: 'descriptors', priority: 2 },
  { id: 'sw-070', english: 'full', filipino: 'puno/busog', category: 'descriptors', priority: 2 },
  // Numbers
  { id: 'sw-071', english: 'one', filipino: 'isa', category: 'numbers', priority: 1 },
  { id: 'sw-072', english: 'two', filipino: 'dalawa', category: 'numbers', priority: 1 },
  { id: 'sw-073', english: 'three', filipino: 'tatlo', category: 'numbers', priority: 1 },
  { id: 'sw-074', english: 'four', filipino: 'apat', category: 'numbers', priority: 1 },
  { id: 'sw-075', english: 'five', filipino: 'lima', category: 'numbers', priority: 1 },
  { id: 'sw-076', english: 'six', filipino: 'anim', category: 'numbers', priority: 2 },
  { id: 'sw-077', english: 'seven', filipino: 'pito', category: 'numbers', priority: 2 },
  { id: 'sw-078', english: 'eight', filipino: 'walo', category: 'numbers', priority: 2 },
  { id: 'sw-079', english: 'nine', filipino: 'siyam', category: 'numbers', priority: 2 },
  { id: 'sw-080', english: 'ten', filipino: 'sampu', category: 'numbers', priority: 2 },
  // Colors
  { id: 'sw-081', english: 'white', filipino: 'puti', category: 'colors', priority: 2 },
  { id: 'sw-082', english: 'black', filipino: 'itim', category: 'colors', priority: 2 },
  { id: 'sw-083', english: 'red', filipino: 'pula', category: 'colors', priority: 2 },
  { id: 'sw-084', english: 'green', filipino: 'berde', category: 'colors', priority: 2 },
  { id: 'sw-085', english: 'yellow', filipino: 'dilaw', category: 'colors', priority: 3 },
  { id: 'sw-086', english: 'blue', filipino: 'asul', category: 'colors', priority: 3 },
  // Time
  { id: 'sw-087', english: 'day', filipino: 'araw', category: 'time', priority: 1 },
  { id: 'sw-088', english: 'night', filipino: 'gabi', category: 'time', priority: 1 },
  { id: 'sw-089', english: 'year', filipino: 'taon', category: 'time', priority: 2 },
  { id: 'sw-090', english: 'morning', filipino: 'umaga', category: 'time', priority: 2 },
  // More body parts
  { id: 'sw-091', english: 'neck', filipino: 'leeg', category: 'body', priority: 2 },
  { id: 'sw-092', english: 'belly', filipino: 'tiyan', category: 'body', priority: 2 },
  { id: 'sw-093', english: 'skin', filipino: 'balat', category: 'body', priority: 2 },
  { id: 'sw-094', english: 'knee', filipino: 'tuhod', category: 'body', priority: 2 },
  { id: 'sw-095', english: 'breast', filipino: 'dibdib', category: 'body', priority: 2 },
  // More nature
  { id: 'sw-096', english: 'lake', filipino: 'lawa', category: 'nature', priority: 2 },
  { id: 'sw-097', english: 'forest', filipino: 'gubat', category: 'nature', priority: 2 },
  { id: 'sw-098', english: 'grass', filipino: 'damo', category: 'nature', priority: 2 },
  { id: 'sw-099', english: 'leaf', filipino: 'dahon', category: 'nature', priority: 2 },
  { id: 'sw-100', english: 'root', filipino: 'ugat', category: 'nature', priority: 2 },
  // More actions
  { id: 'sw-101', english: 'sit', filipino: 'umupo', category: 'actions', priority: 2 },
  { id: 'sw-102', english: 'stand', filipino: 'tumayo', category: 'actions', priority: 2 },
  { id: 'sw-103', english: 'lie/recline', filipino: 'humiga', category: 'actions', priority: 2 },
  { id: 'sw-104', english: 'fly', filipino: 'lumipad', category: 'actions', priority: 2 },
  { id: 'sw-105', english: 'swim', filipino: 'lumangoy', category: 'actions', priority: 2 },
  { id: 'sw-106', english: 'burn', filipino: 'sumunog', category: 'actions', priority: 2 },
  { id: 'sw-107', english: 'fall', filipino: 'mahulog', category: 'actions', priority: 2 },
  { id: 'sw-108', english: 'push', filipino: 'itulak', category: 'actions', priority: 2 },
  { id: 'sw-109', english: 'pull', filipino: 'hilahin', category: 'actions', priority: 2 },
  { id: 'sw-110', english: 'throw', filipino: 'ihagis', category: 'actions', priority: 2 },
  { id: 'sw-111', english: 'cut', filipino: 'putulin', category: 'actions', priority: 2 },
  { id: 'sw-112', english: 'split', filipino: 'hatiin', category: 'actions', priority: 2 },
  { id: 'sw-113', english: 'scratch', filipino: 'kamot', category: 'actions', priority: 3 },
  { id: 'sw-114', english: 'dig', filipino: 'maghukay', category: 'actions', priority: 3 },
  { id: 'sw-115', english: 'wash', filipino: 'maghugas', category: 'actions', priority: 2 },
  { id: 'sw-116', english: 'count', filipino: 'magbilang', category: 'actions', priority: 2 },
  { id: 'sw-117', english: 'sing', filipino: 'kumanta', category: 'actions', priority: 2 },
  { id: 'sw-118', english: 'play', filipino: 'maglaro', category: 'actions', priority: 2 },
  { id: 'sw-119', english: 'laugh', filipino: 'tumawa', category: 'actions', priority: 2 },
  { id: 'sw-120', english: 'cry', filipino: 'umiyak', category: 'actions', priority: 2 },
  // More descriptors
  { id: 'sw-121', english: 'wide', filipino: 'malapad', category: 'descriptors', priority: 2 },
  { id: 'sw-122', english: 'narrow', filipino: 'makitid', category: 'descriptors', priority: 2 },
  { id: 'sw-123', english: 'thick', filipino: 'makapal', category: 'descriptors', priority: 2 },
  { id: 'sw-124', english: 'thin', filipino: 'manipis', category: 'descriptors', priority: 2 },
  { id: 'sw-125', english: 'heavy', filipino: 'mabigat', category: 'descriptors', priority: 2 },
  { id: 'sw-126', english: 'light', filipino: 'magaan', category: 'descriptors', priority: 2 },
  { id: 'sw-127', english: 'sharp', filipino: 'matalim', category: 'descriptors', priority: 2 },
  { id: 'sw-128', english: 'dull', filipino: 'mapurol', category: 'descriptors', priority: 2 },
  { id: 'sw-129', english: 'dirty', filipino: 'marumi', category: 'descriptors', priority: 2 },
  { id: 'sw-130', english: 'clean', filipino: 'malinis', category: 'descriptors', priority: 2 },
  { id: 'sw-131', english: 'wet', filipino: 'basa', category: 'descriptors', priority: 2 },
  { id: 'sw-132', english: 'dry', filipino: 'tuyo', category: 'descriptors', priority: 2 },
  { id: 'sw-133', english: 'right/correct', filipino: 'tama', category: 'descriptors', priority: 2 },
  { id: 'sw-134', english: 'near', filipino: 'malapit', category: 'descriptors', priority: 2 },
  { id: 'sw-135', english: 'far', filipino: 'malayo', category: 'descriptors', priority: 2 },
  { id: 'sw-136', english: 'left', filipino: 'kaliwa', category: 'descriptors', priority: 2 },
  { id: 'sw-137', english: 'right', filipino: 'kanan', category: 'descriptors', priority: 2 },
  // More pronouns/demonstratives
  { id: 'sw-138', english: 'this', filipino: 'ito', category: 'pronouns', priority: 1 },
  { id: 'sw-139', english: 'that', filipino: 'iyon', category: 'pronouns', priority: 1 },
  { id: 'sw-140', english: 'here', filipino: 'dito', category: 'pronouns', priority: 1 },
  { id: 'sw-141', english: 'there', filipino: 'doon', category: 'pronouns', priority: 1 },
  { id: 'sw-142', english: 'who', filipino: 'sino', category: 'pronouns', priority: 1 },
  { id: 'sw-143', english: 'what', filipino: 'ano', category: 'pronouns', priority: 1 },
  { id: 'sw-144', english: 'where', filipino: 'saan', category: 'pronouns', priority: 1 },
  { id: 'sw-145', english: 'when', filipino: 'kailan', category: 'pronouns', priority: 2 },
  { id: 'sw-146', english: 'how', filipino: 'paano', category: 'pronouns', priority: 2 },
  { id: 'sw-147', english: 'all', filipino: 'lahat', category: 'pronouns', priority: 1 },
  { id: 'sw-148', english: 'many', filipino: 'marami', category: 'pronouns', priority: 1 },
  { id: 'sw-149', english: 'some', filipino: 'ilan', category: 'pronouns', priority: 2 },
  { id: 'sw-150', english: 'few', filipino: 'kaunti', category: 'pronouns', priority: 2 },
  // More animals
  { id: 'sw-151', english: 'cat', filipino: 'pusa', category: 'animals', priority: 2 },
  { id: 'sw-152', english: 'pig', filipino: 'baboy', category: 'animals', priority: 2 },
  { id: 'sw-153', english: 'chicken', filipino: 'manok', category: 'animals', priority: 2 },
  { id: 'sw-154', english: 'egg', filipino: 'itlog', category: 'animals', priority: 2 },
  { id: 'sw-155', english: 'louse', filipino: 'kuto', category: 'animals', priority: 3 },
  // More family
  { id: 'sw-156', english: 'husband', filipino: 'asawa (lalaki)', category: 'family', priority: 2 },
  { id: 'sw-157', english: 'wife', filipino: 'asawa (babae)', category: 'family', priority: 2 },
  { id: 'sw-158', english: 'grandmother', filipino: 'lola', category: 'family', priority: 2 },
  { id: 'sw-159', english: 'grandfather', filipino: 'lolo', category: 'family', priority: 2 },
  { id: 'sw-160', english: 'sibling', filipino: 'kapatid', category: 'family', priority: 2 },
  // Objects
  { id: 'sw-161', english: 'house', filipino: 'bahay', category: 'objects', priority: 1 },
  { id: 'sw-162', english: 'road/path', filipino: 'daan', category: 'objects', priority: 1 },
  { id: 'sw-163', english: 'rope', filipino: 'lubid', category: 'objects', priority: 2 },
  { id: 'sw-164', english: 'knife', filipino: 'kutsilyo', category: 'objects', priority: 2 },
  { id: 'sw-165', english: 'stick', filipino: 'patpat', category: 'objects', priority: 2 },
  // Food
  { id: 'sw-166', english: 'meat', filipino: 'karne', category: 'food', priority: 1 },
  { id: 'sw-167', english: 'rice', filipino: 'bigas/kanin', category: 'food', priority: 1 },
  { id: 'sw-168', english: 'salt', filipino: 'asin', category: 'food', priority: 2 },
  { id: 'sw-169', english: 'fruit', filipino: 'prutas', category: 'food', priority: 2 },
  { id: 'sw-170', english: 'seed', filipino: 'buto/binhi', category: 'food', priority: 2 },
  // Sensations
  { id: 'sw-171', english: 'sweet', filipino: 'matamis', category: 'descriptors', priority: 2 },
  { id: 'sw-172', english: 'sour', filipino: 'maasim', category: 'descriptors', priority: 2 },
  { id: 'sw-173', english: 'bitter', filipino: 'mapait', category: 'descriptors', priority: 2 },
  { id: 'sw-174', english: 'salty', filipino: 'maalat', category: 'descriptors', priority: 2 },
  // Misc important
  { id: 'sw-175', english: 'not', filipino: 'hindi', category: 'grammar', priority: 1 },
  { id: 'sw-176', english: 'and', filipino: 'at', category: 'grammar', priority: 1 },
  { id: 'sw-177', english: 'if', filipino: 'kung', category: 'grammar', priority: 2 },
  { id: 'sw-178', english: 'because', filipino: 'dahil', category: 'grammar', priority: 2 },
  { id: 'sw-179', english: 'other', filipino: 'iba', category: 'grammar', priority: 2 },
  // Weather/atmosphere
  { id: 'sw-180', english: 'cloud', filipino: 'ulap', category: 'nature', priority: 2 },
  { id: 'sw-181', english: 'smoke', filipino: 'usok', category: 'nature', priority: 2 },
  { id: 'sw-182', english: 'ash', filipino: 'abo', category: 'nature', priority: 3 },
  { id: 'sw-183', english: 'fog/mist', filipino: 'hamog', category: 'nature', priority: 3 },
  { id: 'sw-184', english: 'ice', filipino: 'yelo', category: 'nature', priority: 3 },
  // More body
  { id: 'sw-185', english: 'liver', filipino: 'atay', category: 'body', priority: 3 },
  { id: 'sw-186', english: 'feather', filipino: 'balahibo', category: 'body', priority: 3 },
  { id: 'sw-187', english: 'horn', filipino: 'sungay', category: 'body', priority: 3 },
  { id: 'sw-188', english: 'tail', filipino: 'buntot', category: 'body', priority: 3 },
  { id: 'sw-189', english: 'back', filipino: 'likod', category: 'body', priority: 2 },
  // More actions
  { id: 'sw-190', english: 'bite', filipino: 'kagat', category: 'actions', priority: 2 },
  { id: 'sw-191', english: 'suck', filipino: 'sumipsip', category: 'actions', priority: 3 },
  { id: 'sw-192', english: 'blow', filipino: 'ihip', category: 'actions', priority: 2 },
  { id: 'sw-193', english: 'breathe', filipino: 'huminga', category: 'actions', priority: 2 },
  { id: 'sw-194', english: 'smell', filipino: 'amoy', category: 'actions', priority: 2 },
  { id: 'sw-195', english: 'fear', filipino: 'takot', category: 'actions', priority: 2 },
  { id: 'sw-196', english: 'squeeze', filipino: 'piga', category: 'actions', priority: 3 },
  { id: 'sw-197', english: 'tie', filipino: 'tali', category: 'actions', priority: 2 },
  { id: 'sw-198', english: 'sew', filipino: 'tahi', category: 'actions', priority: 3 },
  { id: 'sw-199', english: 'hunt', filipino: 'mangaso', category: 'actions', priority: 3 },
  // Round/straight
  { id: 'sw-200', english: 'round', filipino: 'bilog', category: 'descriptors', priority: 2 },
  { id: 'sw-201', english: 'straight', filipino: 'tuwid', category: 'descriptors', priority: 2 },
  { id: 'sw-202', english: 'smooth', filipino: 'makinis', category: 'descriptors', priority: 3 },
  { id: 'sw-203', english: 'rough', filipino: 'magaspang', category: 'descriptors', priority: 3 },
  // Final essentials
  { id: 'sw-204', english: 'live', filipino: 'mabuhay', category: 'actions', priority: 1 },
  { id: 'sw-205', english: 'fight', filipino: 'lumaban', category: 'actions', priority: 2 },
  { id: 'sw-206', english: 'work', filipino: 'magtrabaho', category: 'actions', priority: 2 },
  { id: 'sw-207', english: 'love', filipino: 'mahal', category: 'actions', priority: 1 },
]

export const SWADESH_CATEGORIES = [
  { id: 'pronouns', label: 'Pronouns', icon: 'user' },
  { id: 'body', label: 'Body Parts', icon: 'heart' },
  { id: 'nature', label: 'Nature', icon: 'sun' },
  { id: 'family', label: 'Family', icon: 'users' },
  { id: 'animals', label: 'Animals', icon: 'bird' },
  { id: 'actions', label: 'Actions', icon: 'activity' },
  { id: 'descriptors', label: 'Descriptors', icon: 'type' },
  { id: 'numbers', label: 'Numbers', icon: 'hash' },
  { id: 'colors', label: 'Colors', icon: 'palette' },
  { id: 'time', label: 'Time', icon: 'clock' },
  { id: 'objects', label: 'Objects', icon: 'box' },
  { id: 'food', label: 'Food', icon: 'utensils' },
  { id: 'grammar', label: 'Grammar', icon: 'book' },
]

export function getSwadeshByCategory(category: string): SwadeshWord[] {
  return SWADESH_LIST.filter((w) => w.category === category)
}

export function getSwadeshByPriority(priority: number): SwadeshWord[] {
  return SWADESH_LIST.filter((w) => w.priority <= priority)
}

export function getSwadeshProgress(documentedIds: string[]): {
  total: number
  documented: number
  percentage: number
} {
  const documented = documentedIds.filter((id) =>
    SWADESH_LIST.some((w) => w.id === id)
  ).length
  return {
    total: SWADESH_LIST.length,
    documented,
    percentage: Math.round((documented / SWADESH_LIST.length) * 100),
  }
}
