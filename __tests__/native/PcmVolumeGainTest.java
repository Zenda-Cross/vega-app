import com.brentvatne.exoplayer.PcmVolumeGain;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;

/** Standalone DSP regression checks: compile with PcmVolumeGain.java and run this class. */
public final class PcmVolumeGainTest {
    private static void verify(float gain, short[] samples, short[] expected) {
        ByteBuffer input = ByteBuffer.allocateDirect(samples.length * 2).order(ByteOrder.LITTLE_ENDIAN);
        for (short sample : samples) input.putShort(sample);
        input.flip();
        ByteBuffer output = ByteBuffer.allocateDirect(input.remaining()).order(ByteOrder.LITTLE_ENDIAN);
        PcmVolumeGain.process(input, output, gain);
        if (input.hasRemaining()) throw new AssertionError("Input was not consumed");
        output.flip();
        short[] actual = new short[samples.length];
        for (int i = 0; i < actual.length; i++) actual[i] = output.getShort();
        if (!Arrays.equals(actual, expected)) throw new AssertionError(Arrays.toString(actual));
    }

    public static void main(String[] args) {
        short[] sixChannels = {1000, -1000, 2000, -2000, 3000, -3000};
        verify(2f, sixChannels, new short[]{2000, -2000, 4000, -4000, 6000, -6000});
        verify(1.5f, new short[]{1000, -1000}, new short[]{1500, -1500});
        verify(2f, new short[]{20000, -20000, 32767, -32768}, new short[]{32767, -32768, 32767, -32768});
        verify(1f, sixChannels, sixChannels);
        verify(2f, new short[]{0, 0}, new short[]{0, 0});
        System.out.println("PCM gain: 200%, 150%, clipping, unity/disabled and silence checks passed");
    }
}
