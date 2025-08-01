import { Box, Flex, H1, H4, Panel } from '@bigcommerce/big-design';
import styled from 'styled-components';
import ErrorMessage from '../components/error';
import Loading from '../components/loading';
import { useProducts } from '../lib/hooks';

const Index = () => {
    return (
        <Panel header="Homepage" id="home">
            <Flex>
                <H4>Product customizer builder</H4>
            </Flex>
        </Panel>
    );
};

export default Index;
