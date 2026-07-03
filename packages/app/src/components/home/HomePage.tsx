import { Grid, Box } from '@material-ui/core';
import { Page, Content } from '@backstage/core-components';
import { TimezoneClock } from './TimezoneClock';

import {
  HomePageCompanyLogo,
  HomePageStarredEntities,
  HomePageToolkit,
} from '@backstage/plugin-home';

import {
  SearchContextProvider,
  SearchBar,
} from '@backstage/plugin-search-react';

import HomeIcon from '@material-ui/icons/Home';

/* ---------- Toolkit Links ---------- */
const tools = [
  {
    label: 'Jenkins',
    url: 'https://jenkins.gspann.com',
    icon: (
      <img
        src="/jenkins.svg"
        alt="Jenkins"
        style={{ width: 32, height: 32 }}
      />
    ),
  },
  {
    label: 'Argo CD',
    url: 'https://cd.apps.argoproj.io/',
    icon: (
      <img
        src="/argocd.svg"
        alt="argocd"
        style={{ width: 32, height: 32 }}
      />
    ),
  },
  {
    label: 'Terraform',
    url: 'https://app.terraform.io',
    icon: (
      <img
        src="/terraform.svg"
        alt="terraform"
        style={{ width: 32, height: 32 }}
      />
    ),
  },
  {
    label: 'Grafana',
    url: 'https://play.grafana.org/',
    icon: (
      <img
        src="/Grafana.svg"
        alt="Grafana"
        style={{ width: 32, height: 32 }}
      />
    ),
  },
  {
    label: 'GCP',
    url: 'https://console.cloud.google.com',
    icon: (
      <img
        src="/gcp.svg"
        alt="gcp"
        style={{ width: 32, height: 32 }}
      />
    ),
  },
  {
    label: 'GitHub',
    url: 'https://github.com/',
    icon: (
      <img
        src="/GitHub.svg"
        alt="GitHub"
        style={{ width: 32, height: 32 }}
      />
    ),
  },
  {
    label: 'Kubernetes',
    url: 'https://kubernetes.io',
    icon: (
      <img
        src="/Kubernetes.svg"
        alt="Kubernetes"
        style={{ width: 32, height: 32 }}
      />
    ),
  },
  {
    label: 'Docs',
    url: '/docs',
    icon: (
      <img
        src="/docs.svg"
        alt="docs"
        style={{ width: 32, height: 32 }}
      />
    ),
  },
];


export const HomePage = () => {
  return (
    <SearchContextProvider>
      <Page themeId="home">

        <TimezoneClock />

        <Content
          style={{
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        ></Content>


        {/* Force full height */}
        <Content
          style={{
            minHeight: 'calc(100vh - 64px)', // subtract app header
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Main layout */}
          <Grid
            container
            spacing={6}
            direction="column"
            style={{
              flexGrow: 1,
              marginTop: 60,
            }}
          >

            {/* Logo */}
            <Grid item>
              <Box display="flex" justifyContent="center">
                <HomePageCompanyLogo
                  logo={
                    <img
                      src="/gspann-logo.svg"
                      alt="GSPANN Logo"
                      style={{ height: 120 }}
                    />
                  }
                />
              </Box>
            </Grid>

            {/* Search */}
            <Grid item>
              <Box display="flex" justifyContent="center">
                <Box width="60%">
                  <SearchBar placeholder="Search in developer portal" />
                </Box>
              </Box>
            </Grid>

            {/* Bottom Content (fills remaining space) */}
            <Grid item style={{ flexGrow: 1 }}>
              <Grid container spacing={4}>

                <Grid item xs={12} md={6}>
                  <HomePageStarredEntities />
                </Grid>

                <Grid item xs={12} md={6}>
                  <HomePageToolkit tools={tools} />
                </Grid>

              </Grid>
            </Grid>

          </Grid>
        </Content>
      </Page>
    </SearchContextProvider>
  );
};