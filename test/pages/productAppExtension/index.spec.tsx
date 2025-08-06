jest.mock('@lib/hooks', () => require('@mocks/hooks'));
jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}));

describe('ProductAppExtension', () => {
    //const router = { query: { pid: '1' } };
    // test('renders correctly', () => {
    //     const { container } = render(<ProductAppExtension />);
    //     const panelOneHeader = screen.getByText("Basic Information");

    //     expect(container.firstChild).toMatchSnapshot();
    //     expect(panelOneHeader).toBeInTheDocument();
    // });
});
