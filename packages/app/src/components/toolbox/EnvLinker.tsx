import React, { useState } from 'react';
import { Select, MenuItem, TextField, Button, Box, Typography } from '@material-ui/core';

export const EnvLinker = () => {
  const [service, setService] = useState('');
  const [env, setEnv] = useState('prod');

  const links = {
    logs: `https://splunk.company.com/app/search?q=service=${service}%20env=${env}`,
    metrics: `https://datadog.company.com/dashboard/${service}-${env}`,
  };

  return (
    <Box>
      <Typography variant="body2" style={{ marginBottom: '10px' }}>
        Quickly generate links to logs and metrics for your services:
      </Typography>
      <TextField 
        label="Service Name" 
        placeholder="e.g. user-auth-service"
        value={service} 
        onChange={e => setService(e.target.value)} 
        fullWidth 
        variant="outlined"
        style={{ marginBottom: '20px' }}
      />
      <Select 
        value={env} 
        onChange={e => setEnv(e.target.value as string)} 
        fullWidth
        variant="outlined"
      >
        <MenuItem value="dev">Development</MenuItem>
        <MenuItem value="staging">Staging</MenuItem>
        <MenuItem value="prod">Production</MenuItem>
      </Select>
      
      <Box marginTop={3} display="flex" style={{ gap: '10px' }}>
        <Button 
          variant="contained" 
          color="primary" 
          disabled={!service} 
          href={links.logs} 
          target="_blank"
        >
          Open Splunk Logs
        </Button>
        <Button 
          variant="contained" 
          color="secondary" 
          disabled={!service} 
          href={links.metrics} 
          target="_blank"
        >
          Open Datadog Metrics
        </Button>
      </Box>
    </Box>
  );
};