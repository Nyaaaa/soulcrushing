import React from 'react';
import {
  Container,
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Link,
  SimpleGrid,
  VStack,
  HStack,
  Spacer,
  Input,
  Textarea,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';


export default function Home() {

  return (
    <Container maxW="container.lg" py={8}>
      <Flex as="header" align="center" mb={8}>
        <Heading size="md">Logo</Heading>
        <Spacer />
        <HStack spacing={4} as="nav">
          <Link href="#features">Features</Link>
          <Link href="#about">About</Link>
          <Link href="#contact">Contact</Link>
        </HStack>
      </Flex>

      <Box as="main">
        <Box
          as="section"
          bg="gray.50"
          p={8}
          borderRadius="md"
          textAlign="center"
          mb={8}
        >
          <Heading as="h2" size="xl" mb={4}>
            Welcome to Our Site
          </Heading>
          <Text mb={6}>This is a simple landing page built with React + Chakra UI</Text>
          <Button colorScheme="teal" size="lg">
            Get Started
          </Button>
        </Box>

        <Box as="section" id="features" mb={8}>
          <Heading as="h3" size="lg" mb={4}>
            Features
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading as="h4" size="md" mb={2}>
                Feature One
              </Heading>
              <Text>Description of feature one goes here</Text>
            </Box>
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading as="h4" size="md" mb={2}>
                Feature Two
              </Heading>
              <Text>Description of feature two goes here</Text>
            </Box>
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading as="h4" size="md" mb={2}>
                Feature Three
              </Heading>
              <Text>Description of feature three goes here</Text>
            </Box>
          </SimpleGrid>
        </Box>

        <Box as="section" id="about" mb={8}>
          <Heading as="h3" size="lg" mb={4}>
            About Us
          </Heading>
          <Text>Add your about content here</Text>
        </Box>

        <Box as="section" id="contact" mb={8}>
          <Heading as="h3" size="lg" mb={4}>
            Contact
          </Heading>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input type="email" placeholder="Your email" />
            </FormControl>

            <FormControl>
              <FormLabel>Message</FormLabel>
              <Textarea placeholder="Your message" />
            </FormControl>

            <Button type="submit" colorScheme="teal">
              Send
            </Button>
          </VStack>
        </Box>
      </Box >
    </Container >
  );
}
