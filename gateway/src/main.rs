use anyhow::Result;

// Re-export the main library function for binary usage
use gateway::*;

fn main() -> Result<()> {
    println!("Gateway binary - use as Spin component instead");
    Ok(())
}