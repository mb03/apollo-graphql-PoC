import React, {useCallback, useEffect, useState} from 'react';
import {ApolloProvider, useQuery} from 'react-apollo';
import {InMemoryCache} from 'apollo-cache-inmemory';
import {SubscriptionClient} from 'subscriptions-transport-ws';
import ApolloClient from 'apollo-client';
import {WebSocketLink} from "apollo-link-ws";
import {gql} from "apollo-boost";
import {useLazyQuery} from "@apollo/react-hooks";
// useLazyQuery Demo
// in this case, since the latency is 1s, if clicked more times, it returns only the first result
const LazyQueryDemo: React.FC = () => {
    const [loaded, setLoaded] = useState<number[]>([])
    const [clickCount, setClickCount] = useState(0)
    const [getData] = useLazyQuery(gql(`query { data { test }}`), {
        onCompleted: (data: { data: { test: number } }) => setLoaded(loaded.concat([data.data.test])),
        fetchPolicy: 'network-only'
    });
    // multiple calls suffers the same trouble, only one result.
    // useEffect(()=>{
    //     getData()
    //     getData()
    //     getData()
    //     getData()
    //     getData()
    //     getData()
    //
    // },[])
    return (<>
        <h1>useLazyQuery</h1>
        <button onClick={() => {
            getData()
            setClickCount(clickCount + 1);
        }}>load
        </button>
        <h3>clicked {clickCount} times</h3>
        {loaded.map(n => <p key={n}>{n}</p>)}
    </>);
}
// useQuery Demo with skip true
// fetchMore is unavailable, since the query gets never built
// only refetch is, but it does not cache, i assume that it rebuilds every time
// am i missing something? some API or configuration?
const QueryDemo: React.FC = () => {
    const [loaded, setLoaded] = useState<number[]>([])
    const [clickCount, setClickCount] = useState(0)
    const [fetched, setFetched] = useState(false)
    const {fetchMore, refetch} = useQuery(gql(`query { data { test }}`), {
        onCompleted: (data: { data: { test: number } }) => data && setLoaded(loaded.concat([data.data.test])),
        fetchPolicy: 'network-only',
        skip: true
    });
    const onClick = useCallback(() => {
        if (fetched) {
            console.log('fetchMore')
            fetchMore({
                updateQuery: (data) => {
                    setLoaded(loaded.concat([data.data.test]))
                    return data;
                }
            })
        } else {
            console.log('refetch')
            setFetched(true)
            refetch().then(res => res && res.data && setLoaded(loaded.concat([res.data.data.test])))

        }
        setClickCount(clickCount + 1);
    }, [setClickCount, refetch, setFetched, setLoaded, clickCount, fetchMore, fetched, loaded])
    return (<>
        <h1>useQuery</h1>
        <button onClick={onClick}>load
        </button>
        <h3>clicked {clickCount} times</h3>
        {loaded.map(n => <p key={n}>{n}</p>)}
    </>);
}

export function App() {
    const WSClient = new SubscriptionClient("ws://localhost:7766/ws");

    const GraphQLClient = new ApolloClient({
        link: new WebSocketLink(WSClient),
        cache: new InMemoryCache()
    });

    return (<ApolloProvider client={GraphQLClient}>
        <LazyQueryDemo/>
        <QueryDemo/>
    </ApolloProvider>);
}


export default App;
