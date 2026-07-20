import { useEntity } from '@backstage/plugin-catalog-react';
import { DoraMetricsCard } from '../DoraMetricsCard';
import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
} from '@backstage/core-components';
import { ExampleFetchComponent } from '../ExampleFetchComponent';

export const ExampleComponent = () => {
  const { entity } = useEntity();

  const project =
    entity.metadata.annotations?.['devlake.io/project-name'];

  return (
    <Page themeId="tool">
      <Header title="DevLake DORA Metrics">
        <HeaderLabel label="Owner" value="Team X" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>

      <Content>
        <ContentHeader title="DORA Dashboard">
          <SupportButton>
            Displays DORA metrics from Apache DevLake.
          </SupportButton>
        </ContentHeader>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <DoraMetricsCard project={project ?? ''} />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};