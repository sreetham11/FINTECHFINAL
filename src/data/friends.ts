export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  color: string;
}

export const friends: Friend[] = [
  { id: 'kai', name: 'Kai', username: '@kai_sg', avatar: 'K', color: '#C0001F' },
  { id: 'manoj', name: 'Manoj', username: '@manoj_rp', avatar: 'M', color: '#0033A0' },
  { id: 'priya', name: 'Priya', username: '@priya_sg', avatar: 'P', color: '#FF2D87' },
  { id: 'wei', name: 'Wei', username: '@wei_sg', avatar: 'W', color: '#F5C800' },
];

export const getFriendsByIds = (ids: string[]): Friend[] => {
  return friends.filter(f => ids.includes(f.id));
};

export const searchFriends = (query: string): Friend[] => {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return friends.filter(f => 
    f.name.toLowerCase().includes(q) || 
    f.username.toLowerCase().includes(q)
  );
};
