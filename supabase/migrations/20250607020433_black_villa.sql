/*
  # Update RLS policy for orders table to allow anonymous purchases

  1. Changes
    - Add policy to allow anonymous (public) users to insert orders
    - This enables the checkout page to work for users who aren't logged in
    
  2. Security
    - Maintains existing policies for authenticated users
    - Allows public users to create orders (necessary for checkout)
    - Still restricts other operations appropriately
*/

-- Drop the existing restrictive INSERT policy for orders
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;

-- Create a new policy that allows both authenticated and anonymous users to create orders
CREATE POLICY "Anyone can create orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure the existing SELECT policy allows anyone to view orders (already exists)
-- Ensure UPDATE and DELETE are still restricted to authenticated users (already exists)