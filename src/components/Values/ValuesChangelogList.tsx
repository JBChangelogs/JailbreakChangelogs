import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { getItemImagePath, handleImageError, isVideoItem, getVideoPath } from '@/utils/images';
import { getItemTypeColor } from '@/utils/badgeColors';
import { formatFullValue } from '@/utils/values';

interface Item {
  id: number;
  name: string;
  type: string;
  creator: string;
  cash_value: string;
  duped_value: string;
  tradable: number;
}

interface Changes {
  old: Record<string, string | number | null>;
  new: Record<string, string | number | null>;
}

interface ChangeData {
  change_id: number;
  item: Item;
  changed_by: string;
  reason: string | null;
  changes: Changes;
  posted: number;
  created_at: number;
  id: number;
}

interface ChangelogGroup {
  id: number;
  change_count: number;
  change_data: ChangeData[];
}

interface ValuesChangelogListProps {
  changelogs: ChangelogGroup[];
}

const ValuesChangelogList: React.FC<ValuesChangelogListProps> = ({ changelogs }) => {
  const renderChanges = (changes: Changes) => {
    const changeEntries = Object.entries(changes.new).filter(([key]) => key !== 'last_updated');
    return changeEntries.map(([key, newValue]) => {
      const oldValue = changes.old[key];
      return (
        <Box key={key} sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={oldValue} 
              size="small" 
              color="error" 
              variant="outlined"
            />
            <Typography variant="body2">→</Typography>
            <Chip 
              label={newValue} 
              size="small" 
              color="success" 
              variant="outlined"
            />
          </Box>
        </Box>
      );
    });
  };

  return (
    <Box sx={{ mt: 4 }}>
      {changelogs.map((group) => (
        <Card key={group.id} sx={{ mb: 3, bgcolor: 'background.paper' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                {group.change_count} Changes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDistanceToNow(new Date(group.change_data[0].created_at * 1000), { addSuffix: true })}
              </Typography>
            </Box>
            
            {group.change_data.map((change) => (
              <Box key={change.id} sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ width: 120, height: 90, position: 'relative', flexShrink: 0 }}>
                    {isVideoItem(change.item.name) ? (
                      <video
                        src={getVideoPath(change.item.type, change.item.name)}
                        className="w-full h-full object-cover rounded-md"
                        muted
                        playsInline
                        loop
                        autoPlay
                      />
                    ) : (
                      <Image
                        src={getItemImagePath(change.item.type, change.item.name, true)}
                        alt={change.item.name}
                        fill
                        className="object-cover rounded-md"
                        onError={handleImageError}
                      />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1">
                        {change.item.name}
                      </Typography>
                      <Chip 
                        label={change.item.type} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getItemTypeColor(change.item.type),
                          color: 'white',
                          '& .MuiChip-label': {
                            color: 'white'
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Creator: {change.item.creator}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cash Value: {formatFullValue(change.item.cash_value)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duped Value: {formatFullValue(change.item.duped_value)}
                      </Typography>
                    </Box>

                    {renderChanges(change.changes)}
                  </Box>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ValuesChangelogList; 