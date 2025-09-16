import React from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

export default function PrivacyToggle({ 
  field, 
  isPrivate, 
  onToggle, 
  label = null,
  disabled = false,
  size = "medium" 
}) {
  const displayLabel = label || (isPrivate ? "Private" : "Public");
  console.log(`Rendering PrivacyToggle for field: ${field}, isPrivate: ${isPrivate}`);
  const handleClick = () => {
    if (!disabled && onToggle) {
      onToggle(field);
    }
  };

  return (
    <FormControlLabel
      onClick={handleClick}
      control={
        <Switch 
          checked={isPrivate} 
          size={size}
          disabled={disabled}
          color="primary"
        />
      }
      label={displayLabel}
      sx={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        '& .MuiFormControlLabel-label': {
          fontSize: size === 'small' ? '0.875rem' : '1rem',
          fontWeight: 500,
          color: isPrivate ? 'primary.main' : 'text.secondary'
        }
      }}
    />
  );
}