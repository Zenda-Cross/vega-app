import com.brentvatne.exoplayer.DelayRenderersFactory;
import com.brentvatne.exoplayer.VolumeBoostAudioProcessor;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/** Run against Media3's real BaseAudioProcessor with a minimal Delays holder. */
public final class VolumeBoostAudioProcessorTest {
    public static void main(String[] args) {
        VolumeBoostAudioProcessor processor =
                new VolumeBoostAudioProcessor(new DelayRenderersFactory.Delays());
        for (int round = 0; round < 3; round++) {
            ByteBuffer input = ByteBuffer.allocateDirect(4).order(ByteOrder.LITTLE_ENDIAN);
            input.putShort((short) 1000).putShort((short) -1000).flip();
            processor.queueInput(input);
            ByteBuffer output = processor.getOutput().order(ByteOrder.LITTLE_ENDIAN);
            if (output.remaining() != 4 || output.getShort() != 1000
                    || output.getShort() != -1000) throw new AssertionError("PCM corrupted");
            processor.queueInput(output); // Reproduce pipeline returning drained output.
            if (output.hasRemaining() || processor.getOutput().hasRemaining()) {
                throw new AssertionError("Empty input replayed stale PCM");
            }
            processor.queueInput(ByteBuffer.allocateDirect(0));
            if (processor.getOutput().hasRemaining()) throw new AssertionError("Empty output");
        }
        System.out.println("Processor lifecycle: drained output, empty input and buffer reuse passed");
    }
}
