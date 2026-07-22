import { Box, useMediaQuery, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Page, Content } from '@backstage/core-components';
import { HomeHeroBand } from './HomeHeroBand';
import { HomeWidgetPanel } from './HomeWidgetPanel';
import { HomeStarredEntitiesWidget } from './HomeStarredEntitiesWidget';
import { HomeToolkitWidget } from './HomeToolkitWidget';
import { HOME_WIDGET_THEME } from '../../theme/gspannBrand';
import { HomePageCompanyLogo } from '@backstage/plugin-home';
import {
  SearchContextProvider,
  SearchBar,
} from '@backstage/plugin-search-react';

const tools = [
  {
    label: 'Jenkins',
    url: 'https://jenkins.gspann.com',
    icon: (
      <img src="/jenkins.svg" alt="Jenkins" style={{ width: 32, height: 32 }} />
    ),
  },
  {
    label: 'Argo CD',
    url: 'https://cd.apps.argoproj.io/',
    icon: (
      <img src="/argocd.svg" alt="argocd" style={{ width: 32, height: 32 }} />
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
      <img src="/Grafana.svg" alt="Grafana" style={{ width: 32, height: 32 }} />
    ),
  },
  {
    label: 'GCP',
    url: 'https://console.cloud.google.com',
    icon: <img src="/gcp.svg" alt="gcp" style={{ width: 32, height: 32 }} />,
  },
  {
    label: 'GitHub',
    url: 'https://github.com/',
    icon: (
      <img src="/GitHub.svg" alt="GitHub" style={{ width: 32, height: 32 }} />
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
    icon: <img src="/docs.svg" alt="docs" style={{ width: 32, height: 32 }} />,
  },
];

const useStyles = makeStyles(theme => ({
  homePage: {
    backgroundColor: HOME_WIDGET_THEME.pageBg,
  },
  pageContent: {
    minHeight: 'calc(100vh - 64px)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: HOME_WIDGET_THEME.pageBg,
  },
  layout: {
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    paddingBottom: theme.spacing(3),
  },
  cardsSection: {
    flexGrow: 1,
    display: 'grid',
    width: '100%',
    alignItems: 'stretch',
    gap: theme.spacing(3),
    gridTemplateColumns: '1fr',
    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: '1fr 1fr',
    },
  },
}));

export const HomePage = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <SearchContextProvider>
      <Page themeId="home" className={classes.homePage}>
        <Content className={classes.pageContent}>
          <Box className={classes.layout}>
            <HomeHeroBand
              logo={
                <HomePageCompanyLogo
                  logo={
                    <img
                      src="/gspann-logo.svg"
                      alt="GSPANN Logo"
                      style={{ height: isMobile ? 88 : 108 }}
                    />
                  }
                />
              }
              search={<SearchBar placeholder="Search in developer portal" />}
            />

            <Box className={classes.cardsSection}>
              <HomeWidgetPanel title="Your Starred Entities">
                <HomeStarredEntitiesWidget />
              </HomeWidgetPanel>
              <HomeWidgetPanel title="Toolkit">
                <HomeToolkitWidget tools={tools} />
              </HomeWidgetPanel>
            </Box>
          </Box>
        </Content>
      </Page>
    </SearchContextProvider>
  );
};
